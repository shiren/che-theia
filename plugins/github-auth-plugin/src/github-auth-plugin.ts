/*********************************************************************
 * Copyright (c) 2020 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import * as theia from '@theia/plugin';
import * as che from '@eclipse-che/plugin';

export async function start(context: theia.PluginContext): Promise<void> {
    let session: theia.AuthenticationSession | undefined;
    if (theia.plugins.getPlugin('github.vscode-pull-request-github')) {
        const onDidChangeSessions = new theia.EventEmitter<theia.AuthenticationProviderAuthenticationSessionsChangeEvent>();
        theia.authentication.onDidChangeSessions(async () => {
            await theia.authentication.getSession('github', ['read:user', 'user:email', 'repo']);
        });
        theia.authentication.registerAuthenticationProvider({
            id: 'github',
            label: 'GitHub',
            supportsMultipleAccounts: false,
            onDidChangeSessions: onDidChangeSessions.event,
            getSessions: async () => {
                if (session) {
                    return [session];
                } else {
                    return [];
                }
            },
            login: async (scopeList: string[]) => {
                const githubUser = await che.github.getUser();
                session = {
                    id: 'github-session',
                    accessToken: await che.github.getToken(),
                    account: { label: githubUser.login, id: githubUser.id.toString() },
                    scopes: scopeList
                };
                onDidChangeSessions.fire({ added: [session.id], removed: [], changed: [] });
                return session;
            },
            logout: async (id: string) => {
                session = undefined;
                onDidChangeSessions.fire({ added: [], removed: [id], changed: [] });
            }
        }
        );
    }
}

export function stop(): void {

}
