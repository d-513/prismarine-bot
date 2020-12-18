const YAML = require("js-yaml");

async function getConfig(context) {
  try {
    const conn = await context.octokit.repos.getContent(
      context.repo({ path: ".github/prismarine.yml" })
    );
    // const url = conn.data.download_url;
    // const data = await axios.get(url);
    const contents = Buffer.from(conn.data.content, "base64").toString();
    return YAML.safeLoad(contents);
  } catch (err) {
    return;
  }
}

// commands

const labelAddCMD = "p!label-add ";
const labelRemoveCMD = "p!label-remove ";

/**
 * This is the main entrypoint to your Probot app
 * @param { import('probot').Application } app
 */
module.exports = (app) => {
  app.log.info("Yay, the app was loaded!");

  app.on("issue_comment.created", async (context) => {
    const c = await getConfig(context);
    if (!c || !c.labelmanager || !c.labelmanager) {
      return;
    }
    const body = context.payload.comment.body;
    body.split("\n").forEach((line) => {
      // check if its an add label
      if (line.startsWith(labelAddCMD)) {
        const label = line.slice(labelAddCMD.length);
        context.octokit.issues.addLabels(
          context.issue({ labels: [label.trim()] })
        );
      }

      if (line.startsWith(labelRemoveCMD)) {
        const label = line.slice(labelRemoveCMD.length);
        context.octokit.issues.removeLabel(
          context.issue({ name: label.trim() })
        );
      }
    });
  });

  app.on("issues.opened", async (context) => {
    const contents = await getConfig(context);
    if (!contents) return;
    const c = contents; // shorthand

    if (!c.issuewelcome || !c.issuewelcome.enabled || !c.issuewelcome.message) {
      return;
    } else {
      const issueComment = context.issue({
        body: c.issuewelcome.message,
      });
      return context.octokit.issues.createComment(issueComment);
    }
  });

  app.on(["issues.opened", "issues.edited"], async (context) => {
    const c = await getConfig(context);
    if (!c) return;

    if (
      !c.regexIssueChecks ||
      !c.regexIssueChecks.enabled ||
      !c.regexIssueChecks.regexes
    ) {
      return;
    }
    if (!Array.isArray(c.regexIssueChecks.regexes)) {
      return;
    }

    const regexes = c.regexIssueChecks.regexes;

    let fullfilledRequirements = false;

    regexes.forEach((regex) => {
      const re = new RegExp(regex);
      const res = re.test(context.payload.issue.body);
      if (res) {
        fullfilledRequirements = true;
      }
    });
    console.log(c);
    if (fullfilledRequirements) {
      if (c.regexIssueChecks.successMessage) {
        const issueComment = context.issue({
          body: c.regexIssueChecks.successMessage,
        });
        await context.octokit.issues.createComment(issueComment);
      }

      if (c.regexIssueChecks.successLabels) {
        if (Array.isArray(c.regexIssueChecks.successLabels)) {
          await context.octokit.issues.addLabels(
            context.issue({ labels: c.regexIssueChecks.successLabels })
          );
        }
      }

      // remove labels that were added before it was edited
      if (c.regexIssueChecks.failLabels) {
        if (Array.isArray(c.regexIssueChecks.failLabels)) {
          c.regexIssueChecks.failLabels.forEach((label) => {
            context.octokit.issues.removeLabel(context.issue({ name: label }));
          });
        }
      }

      if (c.regexIssueChecks.reopenOnSuccess) {
        await context.octokit.issues.update(context.issue({ state: "open" }));
      }
    } else {
      if (c.regexIssueChecks.failMessage) {
        const issueComment = context.issue({
          body: c.regexIssueChecks.failMessage,
        });
        await context.octokit.issues.createComment(issueComment);
      }

      if (c.regexIssueChecks.failLabels) {
        if (Array.isArray(c.regexIssueChecks.failLabels)) {
          await context.octokit.issues.addLabels(
            context.issue({ labels: c.regexIssueChecks.failLabels })
          );
        }
      }

      // remove labels that were added before it failed
      if (c.regexIssueChecks.successLabels) {
        if (Array.isArray(c.regexIssueChecks.successLabels)) {
          c.regexIssueChecks.successLabels.forEach((label) => {
            context.octokit.issues
              .removeLabel(context.issue({ name: label }))
              .catch(() => {}); // a simple catch all to not crash if labels not added
          });
        }
      }

      if (c.regexIssueChecks.closeOnFail) {
        await context.octokit.issues.update(context.issue({ state: "closed" }));
      }
    }
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
