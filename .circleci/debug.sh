curl --user 58871610ce9aded55640c426063f9c8ce0f26bdc: \
    --request POST \
    --form revision=2d8b73344a32eecfd66e07d5e5a325a540b4a911 \
    --form config=@debug.yml \
    --form notify=false \
        https://circleci.com/api/v1.1/project/github/marbleprotocol/arbitrage/tree/circle