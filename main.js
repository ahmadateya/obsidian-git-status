'use strict';

const { Plugin } = require('obsidian');
const { exec } = require('child_process');

class GitFileColors extends Plugin {

    async onload() {
        console.log("Git File Colors plugin loaded");

        this.app.workspace.onLayoutReady(() => {
            this.applyGitColors();
        });

        this.registerInterval(
            window.setInterval(() => this.applyGitColors(), 10000)
        );
    }

    getGitStatus() {
        const vaultPath = this.app.vault.adapter.basePath;
        return new Promise((resolve) => {
            exec(
                `git -c core.quotepath=false -C "${vaultPath}" status --porcelain`,
                (error, stdout) => {
                    if (error) {
                        console.error("Git command failed", error);
                        resolve(null);
                    } else {
                        resolve(stdout);
                    }
                }
            );
        });
    }

    parseGitStatus(result) {
        const statusMap = {};
        const lines = result.split('\n').filter(l => l.length > 0);

        for (const line of lines) {
            const x = line[0];
            const y = line[1];
            let filepath = line.substring(3).trim();

            if (filepath.startsWith('"') && filepath.endsWith('"')) {
                filepath = filepath.slice(1, -1);
            }

            if (filepath.includes(' -> ')) {
                filepath = filepath.split(' -> ')[1];
            }

            if (filepath.endsWith('/')) {
                filepath = filepath.slice(0, -1);
            }

            if (x === '?' && y === '?') {
                statusMap[filepath] = 'untracked';
            } else if (x !== ' ') {
                statusMap[filepath] = 'staged';
            } else if (y !== ' ') {
                statusMap[filepath] = 'modified';
            }
        }

        return statusMap;
    }

    async applyGitColors() {
        const result = await this.getGitStatus();
        if (result === null) return;

        const statusMap = this.parseGitStatus(result);

        const fileItems = document.querySelectorAll('.nav-file-title[data-path]');
        for (const item of fileItems) {
            const path = item.getAttribute('data-path');
            item.classList.remove('file-untracked', 'file-modified', 'file-staged');
            const status = statusMap[path];
            if (status) {
                item.classList.add(`file-${status}`);
            }
        }
    }

    onunload() {
        const fileItems = document.querySelectorAll('.nav-file-title[data-path]');
        for (const item of fileItems) {
            item.classList.remove('file-untracked', 'file-modified', 'file-staged');
        }
        console.log("Git File Colors unloaded");
    }
}

module.exports = GitFileColors;
