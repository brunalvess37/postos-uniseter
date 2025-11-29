if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
        if (!user) {
            // Se não estiver logado, redireciona para a tela de login
            window.netlifyIdentity.open("login");
        }
    });

    window.netlifyIdentity.on("login", user => {
        console.log("Logado:", user.email);
        // Fecha o modal de login quando logar
        window.netlifyIdentity.close();
    });

    window.netlifyIdentity.on("logout", () => {
        console.log("Usuário deslogado");
        window.location.reload();
    });
} else {
    console.error("Netlify Identity não carregou.");
}
