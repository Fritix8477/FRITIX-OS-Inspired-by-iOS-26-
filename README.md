# FRITIX OS (Inspired by iOS 26)

Une simulation mobile interactive créée par **FRITIX**, inspirée de l'expérience iOS 26 d'Apple.

FRITIX OS reproduit l'apparence et le fonctionnement d'un smartphone moderne avec une interface fluide, des applications interactives, une Dynamic Island, un centre de contrôle avancé, des widgets personnalisables et bien plus encore.

> ⚠️ Ce projet est une reproduction visuelle et interactive inspirée d'iOS 26. Il n'est ni affilié, ni approuvé, ni sponsorisé par Apple.

---

## ✨ Fonctionnalités

### 📱 Système

* Écran verrouillé
* Écran d'accueil personnalisable
* Widgets interactifs
* Dock dynamique
* Centre de contrôle
* Dynamic Island
* Notifications système
* App Switcher (multitâche)
* Gestion des fonds d'écran
* Sauvegarde locale

### 💬 Applications

* Messages
* Téléphone
* Apple Music
* App Store
* Photos
* Caméra
* Horloge
* Calculatrice
* Notes
* Météo
* Safari
* Wallet
* Réglages
* Assistant NOVA
* Jeux intégrés

### 🎨 Personnalisation

* Déplacement des applications
* Ajout et suppression de widgets
* Personnalisation des icônes
* Modes clair et sombre
* Fonds d'écran personnalisés

---

## 🔒 Confidentialité

FRITIX OS ne collecte aucune donnée.

* Aucune connexion à un serveur externe
* Aucun compte requis
* Aucun système de tracking
* Toutes les données restent stockées localement sur l'appareil de l'utilisateur

Les sauvegardes utilisent uniquement :

* LocalStorage
* Fichiers JSON locaux (si utilisation via `run.py`)

---

## 🚀 Lancement

### Méthode recommandée

```bash
python run.py
```

Cette méthode active la synchronisation avec la base de données JSON locale.

### Alternative

```text
Ouvrir index.html directement
```

Le simulateur fonctionnera également, mais les données seront uniquement enregistrées dans le LocalStorage du navigateur.

---

## 📂 Structure du projet

```text
FRITIX-OS/
│
├── index.html
├── preview.html
├── style.css
├── app.js
│
├── css/
│   ├── 00-foundation.css
│   ├── 10-lockscreen.css
│   ├── 20-homescreen.css
│   ├── 30-apps.css
│   ├── 40-overlays.css
│   ├── 50-animations.css
│   ├── 60-liquid-glass.css
│   └── 90-responsive.css
│
├── js/
│   ├── 00-core.js
│   ├── 10-system-screens.js
│   ├── 20-app-renderers.js
│   ├── 30-overlays.js
│   ├── 40-utils.js
│   └── 50-events.js
│
└── bdd/
    └── etat-telephone.json
```

---

## 🛠 Technologies

* HTML5
* CSS3
* JavaScript Vanilla
* LocalStorage
* JSON Local Database

---

## 📜 Licence

Cette ressource est distribuée gratuitement.

Vous êtes libre de l'utiliser, de la modifier et de l'améliorer dans le respect des licences des ressources utilisées.

---

## 👨‍💻 Auteur

**FRITIX**

Simulation mobile interactive inspirée d'iOS 26.

Projet développé à des fins d'apprentissage, de démonstration technique et d'expérimentation UI/UX.
