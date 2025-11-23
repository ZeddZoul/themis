#!/bin/bash

set -e

echo "🔧 Setting ALL environment variables (final fix)..."

gcloud run services update themis-checker \
  --region us-central1 \
  --add-cloudsql-instances themis-checker:us-central1:themis-db \
  --set-env-vars \
NODE_ENV=production,\
DATABASE_URL="postgresql://postgres:themis.123@/themis?host=/cloudsql/themis-checker:us-central1:themis-db",\
SESSION_SECRET="2dH+ft4Lv4QLbyn+21pEGY5cVeJVAsmQnWaTNoBWjEw=",\
GITHUB_APP_ID="2286117",\
GITHUB_CLIENT_ID="Ov23ct75LCzXpXXuJveq",\
GITHUB_CLIENT_SECRET="51496c84d8e8e3350bb183ff43e26a9602fc1c67",\
GITHUB_WEBHOOK_SECRET="webhook-secret-2024",\
GEMINI_API_KEY="AIzaSyAcvhKrjgxbfIQCPpvZectI8Arho7Z38Qg",\
NEXTAUTH_URL="https://themis-checker-ebiucphrzq-uc.a.run.app",\
NEXT_PUBLIC_APP_URL="https://themis-checker-ebiucphrzq-uc.a.run.app",\
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAz00tOkfELJDs95Uo3ZNNT+Uh1/7FLaLT6R3hWOYM1VJfphhv
YH0SjEevM4z1D+56TW3rzxc/5u1lrgAMGYsEtSGgKqi3cG9CT4OYRSGWNJU4U4xT
0as95R3R+6TYnXCaR4mkO9XQ/sKlviYggzIblkcZdmsnGUXwcN53U9KQtognUOiU
i/ugTtkUX+MAfUr6tHSegVjpon9EwrCfOn28Y2s4l2ODb70lIt5QYwCMRcWq2Y1W
TnKMjwTkekwjM6RnkJ5jaiJz/TCO8q21O5Ctw1DLbcmNVSkmLY4oCd9UQ93SgXCq
LOdnJyJLwPb5kb4mBs8ZcroUc4CFKAhSxhu9bQIDAQABAoIBADAfrHYxHttxsXEw
UVJO1c3MVXT9Ee0sNaGSbDPlA+mpu8alOYXewyWJpqSC/oj6Ra4f7HQg45bKWaZx
IF31pdweuD3u+NbDHVO0Ku8xgtsmIPNUSkkMRcwghhSzCg5Si54718KEOoZJzYw8
8aNDSKA0VTbmXSdC0zSAkJcG9M1Kl0OlzI0q8zMbH+d7P0KH9M8cFMk4koMHvQCo
ELrhLLADMSf3Ygnktky/Sd4t/Hs1+7YzDDqqPEIIsfTF2kH+V7NHeB5mag1ZIiN4
NFOY5aWwpiVcQ2onWcROv2L1tRAxHlQ70iqa+xuht9QP/caX6VViIEcXCSNZq3Cw
1yo+koECgYEA7ZEwih5u/JHmfCAoqZYg9zuuZjMqXXFpulf5z6f7MEEvaE3HG0JG
nDeVuWOFqktuCpG8AEkNGy15dOZdUzNec+dwS5fxS5GCOCXpbWMdiwpKbKlMqbEj
drU2H2MuHshgG5o/t8GMDlmVRBMVvizTxSjWX6sc3Hf5LzZKATQEY1ECgYEA32LR
chBFY7qNhGIiwL7+0F5GNHJv6Br4QwggORfHPasJNpLmCkN+RZaNO2ciZbXIaoiF
I09+KZgdOMQGyjceLclMl85ykndFe/n9qa3BwyNDWkIB6EcgX68fZoxsn48bm0ji
SuuOZ1SwNOmvQnw1db5ylvY8QosLyA5pR4YU2V0CgYB5TCaSfxOAFiauveTFIghW
87wKJpm8+ElZgc3lPwm8C6xe/0doHaDb5m2mKLB40OawstRg+OueMsvO6khAUPwr
BcKKdlwXj4YDkSfsWC0fbvOtI4wnIHDRDZlC0WsdAIZB0bIy6rnOIeNazLvPTCgc
hMtgMYgc8YzjlD6Y+qw64QKBgE4y65sAcyoMPkofiIbs1Yrf1be6b85S0qG0kIMr
/cVqwFjoZ7skEWoO3/XxjqsITdZtYB4ST9oDtAcRKEdVsCzbEQL7dEQtmJdj1ha2
CuRizcsk3EIR1BVq2pUth0D7+fAMPZt4hmtJzD1ZqM6faJ+FQdvy6vlob4Fi+hvd
piLJAoGBAKlfRURxk0RbBfHSTPAAinP8Luxj0fGVzm/FBnU6rNNWApL8Xm6hKbLe
O4lcHqiLO98Q8PZIA+mcqXWHYiUK66xG/KsVrS1QZHD5HGDwSF+6XrTGnkX+Zw5x
AvKpcd2OB6HTrPmJQv+iHEnR5MCR3qz7wrxm+ACsnbyl3rIq4fp6
-----END RSA PRIVATE KEY-----"

echo ""
echo "✅ All environment variables set!"
echo ""
echo "🎯 Test your app:"
echo "https://themis-checker-ebiucphrzq-uc.a.run.app"
