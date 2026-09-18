import imaplib, email

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('escalavincenico28@gmail.com', 'dhhp ayra vlcm ncpw')

mail.select('INBOX')
typ, data = mail.search(None, 'FROM "mailer-daemon"')
ids = data[0].split()
print('Mailer-daemon messages:', [i.decode() for i in ids])
for i in ids:
    res, msg_data = mail.fetch(i, '(RFC822.HEADER)')
    for part in msg_data:
        if isinstance(part, tuple):
            msg = email.message_from_bytes(part[1])
            print('ID:', i.decode(), 'From:', msg.get('from'), 'Subject:', msg.get('subject'), 'Date:', msg.get('date'))

mail.select('"[Gmail]/Spam"')
status, count = mail.select('"[Gmail]/Spam"')
print('Spam count in sender account:', count[0].decode())

mail.close()
mail.logout()
