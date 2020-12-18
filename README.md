# prismarine-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that has some features:

- Auto comment when issue is opened
- Commands that let users add labels to their own issues
- Regex checks for issues not filled the issue template template

## Using hosted instance

Add it to your repo via https://github.com/apps/prismarine-bot  
Create a `.github/prismarine.yml` file in the repo

```yaml
version: "1"

# Issue Welcome
# comments a certain string when an issue is created
issuewelcome:
  enabled: false
  message: >
    Welcome to our github repository and thank you for creating that issue!
# label manager
# lets users add labels to their own issues:
# p!label-add label
# p!label-remove label
labelmanager:
  enabled: true

# Checks issues for a regex
# Useful for making sure noobs fill the issue template correctly
regexIssueChecks:
  # if you want to disable any messages/labels comment the field out
  enabled: true
  # the regexes
  regexes:
    - "this is a regex"
  # comment sent if its successfull
  successMessage: >
    Thank you for filling in the template correctly
  # Labels to add if it succeeds
  successLabels:
    - valid

  # Should the issue
  reopenOnSuccess: true

  # comment sent if failed
  failMessage: >
    You did not fill up the issue template
    Regexes didnt match
  # Labels to add if it fails
  failLabels:
    - invalid

  closeOnFail: true
```

## Self hosting

### Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

### Docker

```sh
# 1. Build container
docker build -t prismarine-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> prismarine-bot
```

## Contributing

If you have suggestions for how prismarine-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.
