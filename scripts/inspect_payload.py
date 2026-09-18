import imaplib, email

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('escalavincenico28@gmail.com', 'dhhp ayra vlcm ncpw')
mail.select('"[Gmail]/Sent Mail"')
typ, data = mail.search(None, 'ALL')
ids = data[0].split()
mid = ids[-4] # ID 108 sent to escalavincenico555@gmail.com
res, msg_data = mail.fetch(mid, '(RFC822)')
for part in msg_data:
    if isinstance(part, tuple):
        msg = email.message_from_bytes(part[1])
        payload = msg.get_payload(decode=True)
        if payload:
            text = payload.decode('utf-8', errors='ignore')
            print("Payload preview (first 500 chars):")
            print(text[:500])
        else:
            print("Payload is None or not decodable directly")
mail.close()
mail.logout()
