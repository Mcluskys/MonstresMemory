# Mémoire des Cris de Monstres

Adaptation web responsive du jeu Pygame **Mémoire des Cris de Monstres**. Cette version est conçue pour fonctionner directement dans un navigateur sur **smartphone, tablette et PC**, et peut être publiée telle quelle avec **GitHub Pages**.

## Fonctionnement du jeu

1. Le joueur peut toucher/clicker chaque monstre pour apprendre son cri.
2. Il lance une manche avec **Débuter**.
3. Le jeu joue une séquence aléatoire de 3 monstres différents.
4. Le joueur reproduit la séquence dans le bon ordre.
5. Une erreur affiche l'écran d'échec puis ramène à l'écoute.
6. Après 4 manches réussies, l'écran de victoire apparaît.

Le comportement spécial du zombie du jeu Python est conservé : son cri est coupé après 1,5 seconde pendant le jeu.

## Responsive / mobile

- Interface tactile sans dépendance au survol de souris.
- Mise en page différente en portrait et paysage.
- Zones tactiles généreuses.
- Prise en compte des encoches iPhone avec `safe-area-inset-*`.
- Support clavier sur PC et focus visible.
- Audio déclenché après interaction utilisateur, compatible avec les restrictions mobiles modernes.
- PWA installable et cache hors-ligne via Service Worker.
- Aucun framework : HTML, CSS et JavaScript natifs.

## Tester localement

Un serveur HTTP est recommandé car les Service Workers ne fonctionnent pas via `file://`.

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Publier sur GitHub Pages

1. Créez un nouveau dépôt GitHub.
2. Ajoutez tout le contenu de ce dossier à la racine du dépôt.
3. Faites un commit et poussez vers la branche `main`.
4. Dans GitHub : **Settings → Pages**.
5. Choisissez **Deploy from a branch**, branche `main`, dossier `/ (root)`.
6. Enregistrez. GitHub indiquera ensuite l'adresse publique du jeu.

## Structure

```text
.
├── index.html
├── styles.css
├── game.js
├── manifest.webmanifest
├── sw.js
├── .nojekyll
└── assets/
    ├── images/
    └── audio/
```

## Personnalisation rapide

Dans `game.js` :

- `MAX_VICTORIES` : nombre de manches à gagner.
- `SEQUENCE_LENGTH` : longueur de la séquence.
- `BETWEEN_SOUNDS` : pause entre deux cris.

Dans `styles.css`, la couleur principale est définie par `--burgundy`.

## Remarque sur la police

La version fournie utilise des polices système pour éviter d'embarquer un fichier de police externe. Cela rend le dépôt plus portable et réduit les problèmes de licence.
