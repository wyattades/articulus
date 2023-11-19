import { signIn, signOut, useSession } from 'next-auth/react';

export const AuthMenu: React.FC<{
  onLogout?: () => MaybePromise<void>;
}> = ({ onLogout }) => {
  const session = useSession();

  if (session.status === 'loading')
    return <p className="text-gray-300">Loading...</p>;

  if (session.status === 'authenticated')
    return (
      <div className="flex items-center">
        {session.data.user ? (
          <>
            <img
              src={session.data.user.image!}
              className="inline-block w-10 h-10 rounded-full border-2 border-white"
              alt="profile"
            />
            <span className="ui-text ml-2 mr-4">{session.data.user.name}</span>
          </>
        ) : null}
        <button
          type="button"
          className="ui-tool-button ui-tool-button--light"
          onClick={async () => {
            await signOut({
              redirect: false,
            });
            if (onLogout) await onLogout();
          }}
        >
          Logout
        </button>
      </div>
    );

  return (
    <button
      type="button"
      className="ui-tool-button ui-tool-button--light"
      onClick={() => {
        void signIn('discord', {
          callbackUrl: window.location.href,
        });
      }}
    >
      Login{' '}
      <img
        src="/images/discord.webp"
        className="inline-block w-6 rounded-full border border-white"
        alt="with Discord"
      />
    </button>
  );
};
