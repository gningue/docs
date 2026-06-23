/*
 * Configuration de confiance Way2tech.ai — clé publique de vérification.
 *
 * Le badge « ✓ Membre vérifié » n'apparaît que pour les cartes signées avec la
 * clé PRIVÉE correspondante (détenue uniquement par l'administrateur dans
 * admin.html). La clé publique ci-dessous sert seulement à VÉRIFIER ; elle ne
 * permet PAS de signer, elle peut donc être publiée sans risque.
 *
 * MISE EN PLACE (une seule fois) :
 *   1. Ouvrez admin.html et cliquez « Générer la clé de l'organisation ».
 *   2. Copiez la clé publique affichée et collez-la ci-dessous (pubKey).
 *   3. Re-déployez le site.
 *
 * Tant que pubKey est vide, la fonctionnalité de badge est simplement inactive
 * (les cartes restent affichables, sans badge).
 */
window.W2T_TRUST = {
  org: "Way2tech.ai",
  pubKey: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEv6lAYY9L9IxytoO-uMojXsvnxu6VeZ7Af6oflKKslEu2UdNZ-rCu2u0UUguNhYIDtCTxs5ONiJkbgCjAoiq_HQ"
};
