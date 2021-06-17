import React from 'react';
import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('components/GameCanvas'), {
  ssr: false,
  loading: ({ error }) => {
    if (error) console.error(error);

    return error ? (
      <p className="status-text" style={{ color: 'red' }}>
        ERROR!
      </p>
    ) : (
      <p className="status-text">Loading...</p>
    );
  },
});

const IndexPage = () => {
  return (
    <div className="container">
      <h1 id="title">Articulus</h1>
      <div className="stack">
        <div id="game-wrapper">
          <GameCanvas />
        </div>
        <div id="directions">
          <h2>Objective:</h2>
          <p>
            Connect rigid bodies with joints to build machines and vehicles in
            this physics sandbox game!
          </p>
          <h2>Legend:</h2>
          <ul>
            <li>
              <code>[SPACE]</code>
              <span>Pause/Resume</span>
            </li>
            <li>
              <code>R</code>
              <span>Restart</span>
            </li>
            <li>
              <code>T</code>
              <span>Switch between Editor/Play</span>
            </li>
            <li>
              <code>CTRL</code>
              <span>+ mouse scroll to zoom in and out</span>
            </li>
            <li>
              <span>
                Hold right click and drag OR use the arrow keys to pan the
                camera
              </span>
            </li>
          </ul>
        </div>
      </div>
      <br />
    </div>
  );
};

export default IndexPage;
