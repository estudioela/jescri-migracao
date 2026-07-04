document.addEventListener("DOMContentLoaded", () => {
    // 1. Automação de Vogais em Itálico (IvyPresto Display)
    const editorialTitles = document.querySelectorAll('.title-editorial');
    editorialTitles.forEach(title => {
        const text = title.innerHTML;
        title.innerHTML = text.replace(/(?![^<]*>)([aeiouáéíóúãõâêîôû])/gi, '<span class="vowel">$1</span>');
    });

    // 2. Scroll suave do Hero (Seta)
    const scrollBtn = document.getElementById("scroll-down");
    if(scrollBtn) {
        scrollBtn.addEventListener("click", () => {
            const nextSection = document.getElementById("sobre-nos");
            if(nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
        });
    }

    // 3. Lógica do Acordeon (Limpa e Funcional)
    const accordions = document.querySelectorAll('.accordion-item');
    accordions.forEach(acc => {
        const header = acc.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            const isOpen = acc.classList.contains('active');
            const content = acc.querySelector('.accordion-content');
            
            // Fecha os outros
            accordions.forEach(a => {
                a.classList.remove('active');
                a.querySelector('.accordion-content').style.maxHeight = null;
                a.querySelector('.accordion-icon').textContent = '+';
            });
            
            // Abre o clicado
            if (!isOpen && content.innerHTML.trim() !== "") {
                acc.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
                acc.querySelector('.accordion-icon').textContent = '-';
            }
        });
    });

    // Abre o primeiro item do acordeon por padrão
    const firstAcc = document.querySelector('.accordion-item');
    if(firstAcc) {
        firstAcc.classList.add('active');
        const firstContent = firstAcc.querySelector('.accordion-content');
        firstContent.style.maxHeight = firstContent.scrollHeight + "px";
        firstAcc.querySelector('.accordion-icon').textContent = '-';
    }

    // Recalcula altura no resize
    window.addEventListener('resize', () => {
        const activeAcc = document.querySelector('.accordion-item.active .accordion-content');
        if(activeAcc) {
            activeAcc.style.maxHeight = activeAcc.scrollHeight + "px";
        }
    });

    // 4. Animações GSAP (Estilo Editorial / Vogue)
    gsap.registerPlugin(ScrollTrigger);

    // Fade in do cabeçalho
    gsap.to(".header-container .logo-link, .nav-link", {
        opacity: 1,
        visibility: "visible",
        y: 0,
        duration: 1.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3
    });

    gsap.set(".gsap-fade, .stagger-item", { visibility: "visible" });

    // Parallax Sutil no Vídeo Hero
    gsap.to(".hero-bg", {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Transição (Efeito Cortina) sutil e sem sobreposições
    gsap.to("#arquitetura", {
        yPercent: 5, 
        ease: "none",
        scrollTrigger: {
            trigger: "#metodologia",
            start: "top bottom", 
            end: "top top",      
            scrub: true
        }
    });

    // Revelação dos Textos (Fade Up Elegante)
    const fadeElements = document.querySelectorAll(".gsap-fade");
    fadeElements.forEach((el) => {
        gsap.fromTo(el, 
            { y: 30, opacity: 0 }, 
            {
                y: 0, opacity: 1, duration: 1.4, ease: "power2.out",
                scrollTrigger: { 
                    trigger: el, 
                    start: "top 85%", 
                    toggleActions: "play none none reverse" 
                }
            }
        );
    });

    // Revelação em Cascata para os parágrafos (Stagger Lento)
    const staggerGroups = document.querySelectorAll(".stagger-group");
    staggerGroups.forEach((group) => {
        const items = group.querySelectorAll(".stagger-item");
        gsap.fromTo(items, 
            { y: 20, opacity: 0 }, 
            {
                y: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power2.out",
                scrollTrigger: { 
                    trigger: group, 
                    start: "top 80%", 
                    toggleActions: "play none none reverse" 
                }
            }
        );
    });

    // --- NOVA ANIMAÇÃO: EFEITO CASCATA EDITORIAL NOS LINKS DO FOOTER ---
    gsap.set(".footer-link-item", { visibility: "visible" });

    gsap.fromTo(".footer-link-item", 
        { opacity: 0, x: -15 }, 
        {
            opacity: 1, x: 0,
            duration: 1.5,
            stagger: 0.15, // Velocidade com que cada palavra se revela (efeito dominó)
            ease: "power2.out",
            scrollTrigger: { 
                trigger: ".footer-links", 
                start: "top 90%", 
                toggleActions: "play none none reverse" 
            }
        }
    );
});
