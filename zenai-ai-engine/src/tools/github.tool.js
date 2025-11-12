const { DynamicTool } = require('langchain/tools');
const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');

class GitHubTool {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  createTools() {
    return [
      new DynamicTool({
        name: 'github_create_issue',
        description: 'Create GitHub issue',
        func: async (input) => {
          try {
            const data = JSON.parse(input);
            const issue = await this.createIssue(data);
            return `Issue created: ${issue.html_url}`;
          } catch (error) {
            logger.error('GitHub create issue error:', error);
            return `Error creating issue: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'github_create_pr',
        description: 'Create pull request',
        func: async (input) => {
          try {
            const data = JSON.parse(input);
            const pr = await this.createPullRequest(data);
            return `PR created: ${pr.html_url}`;
          } catch (error) {
            logger.error('GitHub create PR error:', error);
            return `Error creating PR: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'github_get_repo_info',
        description: 'Get repository information',
        func: async (input) => {
          try {
            const { owner, repo } = JSON.parse(input);
            const info = await this.getRepoInfo(owner, repo);
            return JSON.stringify(info);
          } catch (error) {
            logger.error('GitHub get repo error:', error);
            return `Error getting repo: ${error.message}`;
          }
        }
      })
    ];
  }

  async createIssue(data) {
    const { owner, repo, title, body, labels, assignees } = data;
    
    const response = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees
    });
    
    return response.data;
  }

  async createPullRequest(data) {
    const { owner, repo, title, body, head, base } = data;
    
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base: base || 'main'
    });
    
    return response.data;
  }

  async getRepoInfo(owner, repo) {
    const response = await this.octokit.repos.get({ owner, repo });
    
    return {
      name: response.data.name,
      description: response.data.description,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      openIssues: response.data.open_issues_count,
      language: response.data.language,
      url: response.data.html_url
    };
  }
}

module.exports = GitHubTool;