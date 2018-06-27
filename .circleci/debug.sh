curl --user 58871610ce9aded55640c426063f9c8ce0f26bdc: \
    --request POST \
    --form revision=6ba4b0e39a2f32a20699992702deeeb990627909 \
    --form config=@./.circleci/debug.yml \
    --form notify=false \
        https://circleci.com/api/v1.1/project/github/marbleprotocol/arbitrage/tree/master