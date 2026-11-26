import { Link } from '@tanstack/react-router';
import styles from './privacy-page.module.css';

/** Contact pour exercer ses droits (RGPD). Une seule adresse à changer ici. */
export const PRIVACY_CONTACT = 'almahtec@gmail.com';
const UPDATED_ON = '26 novembre 2026';

/**
 * Politique de confidentialité, publique (sans compte) : exigée par le RGPD et par Google
 * pour la connexion avec Google. Elle décrit ce que l'app fait réellement : à tenir à jour
 * quand une donnée, un service ou une durée de conservation change.
 */
export function PrivacyPage() {
  const mail = <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>;

  return (
    <main className={styles.page}>
      <article className={styles.content}>
        <Link to="/" className={styles.back}>
          ← Retour à PlaceGratos
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>Politique de confidentialité</h1>
          <p className={styles.updated}>Mise à jour le {UPDATED_ON}</p>
          <p>
            PlaceGratos aide à trouver des places de stationnement gratuites grâce aux contributions
            de ses utilisateurs. Cette page explique quelles données sont collectées, pourquoi, et
            comment exercer vos droits.
          </p>
        </header>

        <section>
          <h2>Responsable du traitement</h2>
          <p>Ahmed DEM, éditeur de PlaceGratos. Contact : {mail}.</p>
        </section>

        <section>
          <h2>Données collectées</h2>
          <ul>
            <li>
              <strong>Compte</strong> : adresse e-mail, pseudo, date d’inscription. Le mot de passe
              n’est jamais conservé en clair, seulement sous une forme chiffrée irréversible.
            </li>
            <li>
              <strong>Connexion avec Google</strong> (si vous la choisissez) : identifiant Google,
              prénom, nom et photo de profil transmis par Google. Nous ne recevons jamais votre mot
              de passe Google.
            </li>
            <li>
              <strong>Contributions</strong> : parkings ajoutés (emplacement, description, photos),
              signalements de places libres, votes, commentaires, points et badges. Vos
              contributions et votre pseudo sont visibles des autres utilisateurs, classement
              compris.
            </li>
            <li>
              <strong>Position</strong> : utilisée pour afficher les parkings autour de vous. Elle
              est envoyée au serveur le temps de la recherche et n’est pas enregistrée dans notre
              base.
            </li>
            <li>
              <strong>Journaux techniques</strong> : pour chaque appel au serveur, l’adresse appelée
              (sans votre position), l’heure, le résultat, la durée et le type de navigateur (« user
              agent »). Ni adresse IP ni identifiant de compte.
            </li>
          </ul>
        </section>

        <section>
          <h2>Pourquoi</h2>
          <ul>
            <li>
              Créer votre compte, vous connecter, afficher et partager les contributions :
              nécessaire au service que vous utilisez.
            </li>
            <li>
              Sécurité et bon fonctionnement (limitation des tentatives de connexion, prévention des
              abus, sauvegardes, journaux techniques pour détecter les pannes et les robots) :
              intérêt légitime à protéger le service et ses utilisateurs.
            </li>
          </ul>
          <p>Aucune publicité, aucune revente de données, aucun profilage.</p>
        </section>

        <section>
          <h2>Durée de conservation</h2>
          <ul>
            <li>Compte et contributions : tant que le compte existe.</li>
            <li>
              Session de connexion : 30 jours au plus sans utiliser l’application (prolongée à
              chaque utilisation).
            </li>
            <li>Sauvegardes chiffrées de la base : 30 jours.</li>
            <li>Journaux techniques : 7 jours.</li>
          </ul>
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis votre profil. Votre e-mail, votre
            pseudo, vos points, vos badges et vos commentaires sont alors effacés. Les parkings que
            vous avez ajoutés restent sur la carte, au nom de PlaceGratos, et vos votes et
            signalements sont conservés sans aucun lien avec vous. Vous pouvez aussi écrire à {mail}.
          </p>
        </section>

        <section>
          <h2>Hébergement et prestataires</h2>
          <ul>
            <li>Base de données : Supabase, dans l’Union européenne (Irlande).</li>
            <li>
              Serveur de l’application, journaux techniques et sauvegardes : Scaleway, en France.
            </li>
            <li>Diffusion de l’application : Google Firebase Hosting.</li>
            <li>
              Photos des parkings : Cloudinary. Ce prestataire peut traiter des données hors de
              l’Union européenne, avec les garanties prévues par le RGPD (clauses contractuelles
              types).
            </li>
            <li>Connexion avec Google : Google, si vous choisissez ce mode de connexion.</li>
            <li>
              Fonds de carte : OpenFreeMap. Votre navigateur télécharge la carte directement auprès
              de ce service, qui reçoit donc votre adresse IP.
            </li>
          </ul>
        </section>

        <section>
          <h2>Cookies et stockage local</h2>
          <ul>
            <li>
              Un cookie de session, indispensable pour rester connecté (30 jours au plus),
              inaccessible aux scripts de la page.
            </li>
            <li>
              Un cookie temporaire pendant la connexion avec Google, contre la falsification de la
              connexion (10 minutes).
            </li>
            <li>
              Le stockage de votre navigateur : il retient que l’écran de présentation a été vu et
              garde l’application disponible hors connexion.
            </li>
          </ul>
          <p>
            Aucun cookie publicitaire ni de mesure d’audience : c’est pourquoi aucun bandeau de
            consentement ne s’affiche.
          </p>
        </section>

        <section>
          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, leur
            portabilité, la limitation de leur traitement ou vous y opposer, en écrivant à {mail}.
            Nous répondons sous un mois. Vous pouvez aussi adresser une réclamation à la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
              cnil.fr
            </a>
            ).
          </p>
        </section>
      </article>
    </main>
  );
}
