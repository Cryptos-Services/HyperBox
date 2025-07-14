import * as Principal from "@ucanto/principal";

const main = async () => {
  const principal = await Principal.ed25519.generate();
  const exported = await principal.toArchive(); // <-- la bonne méthode
  console.log("STORACHA_AGENT_KEY=" + JSON.stringify(exported));
  console.log("STORACHA_AGENT_DID=" + principal.did());
};
main();
