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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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
        $dados = $this->cepLookup->preencherEnderecoSeNecessario($request->validated());

        $parceira = Parceira::create($dados);

        return new ParceiraResource($parceira);
    }

    public function show(Parceira $parceira): ParceiraResource
    {
        $this->authorize('view', $parceira);

        return new ParceiraResource($parceira);
    }

    public function update(
        UpdateParceiraRequest $request,
        Parceira $parceira,
        AtualizarCadastroComConsentimentoService $consentimentoService
    ): ParceiraResource {
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

            $token = Password::broker()->createToken($user);
            $user->notify(new InfluenciadoraConviteNotification($token));
        }

        return new ParceiraResource($parceira);
    }
}
