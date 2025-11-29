
const { Octokit } = require("@octokit/rest");

exports.handler = async (event)=>{
  try{
    const body = JSON.parse(event.body);
    const data = body.data || [];

    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    const path = process.env.GITHUB_TARGET_PATH;
    const token = process.env.GITHUB_COMMIT_TOKEN;

    const octokit = new Octokit({ auth: token });

    const content = Buffer.from(JSON.stringify(data,null,2)).toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: "Atualização automática via Admin",
      content,
      sha: undefined
    });

    return { statusCode:200, body:"Upload concluído!" };
  } catch(e){
    return { statusCode:500, body:"Erro: "+e.message };
  }
};
