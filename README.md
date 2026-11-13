# EduNova

EduNova est une plateforme web de révision en français destinée aux élèves du collège et du lycée. Elle rassemble des fiches, des exercices, des quiz, des cartes mémoire et plusieurs outils d'apprentissage.

Site : https://ayubdjazouli-code.github.io/Studybot/

## Fonctionnalités disponibles

- Fiches de révision et ressources par matière.
- Création de fiches et de cartes mémoire à partir d'un texte de cours.
- Quiz et entraînements.
- Calculatrice scientifique.
- Outils de langues et de suivi de progression (XP).
- Mode sombre et interface adaptée aux mobiles.
- Export et restauration d'une sauvegarde locale.
- Création de compte avec Supabase ; le profil et les points XP peuvent être synchronisés.

## Utilisation

Ouvre le site dans un navigateur. Les cours personnels, tâches, notes et préférences locales sont conservés dans le stockage du navigateur de l'appareil. La synchronisation du profil et des XP nécessite une connexion à un compte.

Sur iPhone : ouvrir le site dans Safari, toucher **Partager**, puis **Sur l’écran d’accueil**. Sur Android : utiliser la fonction d'installation du navigateur lorsque celle-ci est proposée.

## Limites à connaître

- L'assistant pédagogique actuel repose sur des règles et du contenu intégré ; il n'est pas connecté à un service d'IA générative.
- Le scanner peut afficher une image, mais la reconnaissance automatique du texte (OCR) n'est pas disponible.
- Les abonnements et paiements ne sont pas activés. Les offres affichées sont informatives et ne doivent pas être présentées comme des paiements opérationnels.
- Les contenus sont des supports de révision généraux : ils doivent être vérifiés avec le cours et les consignes de l'enseignant.

## Données et confidentialité

- L'adresse e-mail sert à l'authentification du compte.
- Le profil peut contenir l'âge, le type d'établissement, la ville (facultative), le niveau scolaire et les points XP.
- Les cours, tâches, notes et préférences de l'application sont conservés localement dans le navigateur de l'appareil.
- N'entre pas de mot de passe scolaire, d'adresse personnelle, de données de santé ou d'autres informations sensibles dans tes cours.
- Avant de changer d'appareil ou de navigateur, exporte une sauvegarde locale si tu souhaites conserver tes données.

## Déploiement

Le dépôt utilise GitHub Pages avec GitHub Actions. Les changements poussés sur la branche `main` déclenchent le workflow de déploiement défini dans `.github/workflows/pages.yml`.
