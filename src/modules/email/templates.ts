const escape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function priceAlertEmail(input: { title: string; message: string; manageUrl: string }) {
  const title = escape(input.title),
    message = escape(input.message),
    url = escape(input.manageUrl);
  return {
    subject: `GameRadar CZ: ${input.title}`,
    text: `${input.message}\n\nSpráva upozornění: ${input.manageUrl}`,
    html: `<h1>${title}</h1><p>${message}</p><p><a href="${url}">Spravovat upozornění</a></p>`,
  };
}
export function accountEmail(kind: "verify" | "reset", url: string) {
  const reset = kind === "reset";
  return {
    subject: reset ? "Obnovení hesla GameRadar CZ" : "Ověření e-mailu GameRadar CZ",
    text: `${reset ? "Obnovit heslo" : "Ověřit e-mail"}: ${url}`,
    html: `<p><a href="${escape(url)}">${reset ? "Obnovit heslo" : "Ověřit e-mail"}</a></p>`,
  };
}
