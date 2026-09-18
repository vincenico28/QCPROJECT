import imaplib, email

mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('escalavincenico28@gmail.com', 'dhhp ayra vlcm ncpw')

status, folders = mail.list()
for f in folders:
    print(f.decode())

# Select Sent folder
status, count = mail.select('"[Gmail]/Sent Mail"')
print('Sent Mail count:', count[0].decode())
typ, data = mail.search(None, 'ALL')
ids = data[0].split()
print('Last 10 Sent messages:')
for i in ids[-10:]:
    res, msg_data = mail.fetch(i, '(RFC822.HEADER)')
    for response_part in msg_data:
        if isinstance(response_part, tuple):
            msg = email.message_from_bytes(response_part[1])
            print('--- ID:', i.decode(), '---')
            print('  To:', msg.get('to'))
            print('  Subject:', msg.get('subject'))
            print('  Date:', msg.get('date'))

mail.close()
mail.logout()
