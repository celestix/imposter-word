# Imposter Word

Online multiplayer word guessing game. One player is the **imposter** (they don’t see the word). Everyone gives hints in public; the imposter tries to guess the word. Then everyone votes for who they think is the imposter.

## Scoring

- **+1** if you correctly vote for the imposter
- **+1** to the imposter for each player who voted for someone else (wrong guess)
- **+2** to the imposter if nobody votes for them
- **0** otherwise

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. **Create game** – Host creates a session and (optionally) enters their name to join.
2. **Join** – Others join with the session ID and their name.
3. **Start** – When there are at least 2 players, anyone can start the game.
4. **Play** – A random word is shown to everyone except the imposter (they see `???`). Everyone can vote for who they think is the imposter.
5. **Verdict** – When all have voted, the imposter is revealed and round/total scores are shown.
6. **Next round** – Click “Next round” to play again (no round limit).

## Tech

- **Framework:** Next.js (App Router), React
- **Styling:** Tailwind CSS
- **State:** In-memory store (API routes); client polls every 2s

Word list and voting/verdict logic are implemented; hints are given verbally (hybrid game).
