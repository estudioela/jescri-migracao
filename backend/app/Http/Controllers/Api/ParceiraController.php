<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parceira\StoreParceiraRequest;
use App\Http\Requests\Parceira\UpdateParceiraRequest;
use App\Http\Resources\ParceiraResource;
use App\Models\Parceira;
use App\Models\User;
use App\Notifications\InfluenciadoraConviteNotification;
use App\Services\AtualizarCadastroComConsentimentoService;
use App\Services\CepLookupService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class ParceiraController extends Controller
{
    public function __construct(private readonly CepLookupService $cepLookup) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Parceira::class);

        $request->validate([
            'status' => ['sometimes', Rule::in(['Ativa', 'Inativa'])],
        ]);

        return ParceiraResource::collection(
            Parceira::when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
                ->when(
                    ! $request->user()->hasRole('ADMIN'),
                    fn ($query) => $query->where('user_id', $request->user()->id)
                )
                ->orderBy('nome')
                ->paginate(20)
        );
    }

    public function store(StoreParceiraRequest $request): ParceiraResource
    {
        $this->authorize('create', Parceira::class);

        $dados = $this->cepLookup->preencherEnderecoSeNecessario($request->validated());
        unset($dados['consentimento_aceito']);

        $parceira = Parceira::create($dados);
        $parceira->registrarConsentimentoCadastro($request->ip());

        return new ParceiraResource($parceira);
    }

    public function show(Parceira $parceira): ParceiraResource
    {
        $this->authorize('view', $parceira);

        return new ParceiraResource($parceira);
    }

    /**
     * Perfil da própria Parceira, resolvido sempre pela sessão — nunca por
     * parâmetro (RN de isolamento do Portal, ESPECIFICACAO_FUNCIONAL §6).
     */
    public function me(Request $request): ParceiraResource
    {
        $parceira = $request->user()->parceira;

        abort_if($parceira === null, 404);

        return new ParceiraResource($parceira);
    }

    public function update(
        UpdateParceiraRequest $request,
        Parceira $parceira,
        AtualizarCadastroComConsentimentoService $consentimentoService
    ): ParceiraResource {
        $this->authorize('update', $parceira);

        $dados = collect($request->validated())->except('consentimento_aceito')->all();

        if (($dados['cep'] ?? null) !== $parceira->cep) {
            $dados = $this->cepLookup->preencherEnderecoSeNecessario($dados);
        }

        $parceira = $consentimentoService->atualizar($parceira, $dados, $request->user(), $request->ip());

        return new ParceiraResource($parceira);
    }

    public function aprovar(Request $request, Parceira $parceira): ParceiraResource|JsonResponse
    {
        if ($parceira->status === 'Ativa') {
            return response()->json([
                'message' => 'Parceira já está ativa.',
            ], 409);
        }

        try {
            DB::transaction(function () use ($request, $parceira) {
                $parceira->aprovar($request->user());

                if ($parceira->user_id === null) {
                    $user = User::create([
                        'name' => $parceira->nome,
                        'email' => $parceira->email,
                        'password' => Str::random(40),
                    ]);

                    Role::findOrCreate('INFLUENCIADORA', 'web');
                    $user->assignRole('INFLUENCIADORA');

                    $parceira->vincularUsuario($user);

                    $this->enviarConvite($user);
                }
            });
        } catch (QueryException $e) {
            if ($e->getCode() !== '23000') {
                throw $e;
            }

            return response()->json([
                'message' => 'Já existe um usuário cadastrado com este e-mail. Ajuste o e-mail da parceira antes de aprovar.',
            ], 422);
        }

        return new ParceiraResource($parceira->fresh());
    }

    /**
     * Reenvia o e-mail de convite (definir senha) para uma parceira já
     * aprovada — cobre o caso de o token de 60 min ter expirado antes de ela
     * definir a senha, ou de o e-mail original ter se perdido. Reaproveita a
     * mesma notificação e o mesmo broker de token já usados em aprovar().
     */
    public function reenviarConvite(Parceira $parceira): JsonResponse
    {
        if ($parceira->user_id === null) {
            return response()->json([
                'message' => 'Esta parceira ainda não foi aprovada.',
            ], 409);
        }

        $this->enviarConvite($parceira->user);

        return response()->json(['message' => 'Convite reenviado.']);
    }

    public function reprovar(Request $request, Parceira $parceira): ParceiraResource|JsonResponse
    {
        if ($parceira->status === 'Ativa') {
            return response()->json([
                'message' => 'Parceira já está ativa.',
            ], 409);
        }

        if ($parceira->reprovado_em !== null) {
            return response()->json([
                'message' => 'Parceira já foi reprovada.',
            ], 409);
        }

        $request->validate([
            'motivo' => ['nullable', 'string', 'max:1000'],
        ]);

        $parceira->reprovar($request->user(), $request->input('motivo'));

        return new ParceiraResource($parceira);
    }

    private function enviarConvite(User $user): void
    {
        $token = Password::broker()->createToken($user);
        $user->notify(new InfluenciadoraConviteNotification($token));
    }
}
