function getPhoneNumber(jid) {
  if (!jid) return "";

  if (jid.includes(":")) {
    jid = jidDecode(jid)?.user || jid;
  }

  return jid.split("@")[0];
}
