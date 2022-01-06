import React, {
    ComponentType,
    FunctionComponent,
} from 'react';
import { Auth, appendToCognitoUserAgent } from '@aws-amplify/auth';
import { AmplifyContainer, AmplifyAuthenticator, AmplifyAuthContainer, AmplifySignIn, AmplifySignOut } from '@aws-amplify/ui-react';
import { onAuthUIStateChange, AuthState } from '@aws-amplify/ui-components';
import { Logger } from '@aws-amplify/core';

const logger = new Logger('withAuth');

export function withAuth<T extends object>(Component: ComponentType<T>) {
    const AppWithAuthenticator: FunctionComponent<T> = props => {
        const [signedIn, setSignedIn] = React.useState(false);

        React.useEffect(() => {
            appendToCognitoUserAgent('withAuth');

            // checkUser returns an "unsubscribe" function to stop side-effects
            return checkUser();
        });

        function checkUser() {
            setUser();

            return onAuthUIStateChange(authState => {
                if (authState === AuthState.SignedIn) {
                    setSignedIn(true);
                } else if (authState === AuthState.SignedOut) {
                    setSignedIn(false);
                }
            });
        }

        async function setUser() {
            try {
                const user = await Auth.currentAuthenticatedUser();
                if (user) setSignedIn(true);
            } catch (err) {
                logger.debug(err);
            }
        }

        if (!signedIn) {
            return (
                <AmplifyContainer>
                    <AmplifyAuthContainer>
                        <AmplifyAuthenticator  {...props}>
                            <AmplifySignIn slot="sign-in" hideSignUp />
                        </AmplifyAuthenticator>
                    </AmplifyAuthContainer>
                </AmplifyContainer>
            );
        } else {
            return (
                <Component {...props} />
            );
        }
    };

    return AppWithAuthenticator;
}