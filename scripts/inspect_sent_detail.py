import imaplib, email

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('escalavincenico28@gmail.com', 'dhhp ayra vlcm ncpw')
mail.select('"[Gmail]/Sent Mail"')
typ, data = mail.search(None, 'ALL')
ids = data[0].split()
print("Total sent:", len(ids))
for mid in ids[-5:]:
    res, msg_data = mail.fetch(mid, '(RFC822)')
    for part in msg_data:
        if isinstance(part, tuple):
            msg = email.message_from_bytes(part[1])
            print('ID:', mid.decode(), '| To:', msg.get('to'), '| Subject:', msg.get('subject')[:60])
            print('  Headers: From =', msg.get('from'), '| Reply-To =', msg.get('reply-to'), '| Message-ID =', msg.get('message-id'))
            print('  Content-Type:', msg.get_content_type())
mail.close()
mail.logout()
