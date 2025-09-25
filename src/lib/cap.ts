import Cap from '@cap.js/server';

type ChallengeData = Cap.ChallengeData;

const challenges = new Map<string, ChallengeData>();
const tokens = new Map<string, number>();

export const cap = new Cap({
  noFSState: true,
  storage: {
    challenges: {
      async store(token, challengeData) {
        challenges.set(token, challengeData);
      },
      async read(token) {
        const data = challenges.get(token);
        if (!data) {
          return null;
        }
        if (data.expires <= Date.now()) {
          challenges.delete(token);
          return null;
        }
        return data;
      },
      async delete(token) {
        challenges.delete(token);
      },
      async deleteExpired() {
        const now = Date.now();
        challenges.forEach((data, token) => {
          if (data.expires <= now) {
            challenges.delete(token);
          }
        });
      },
    },
    tokens: {
      async store(tokenKey, expires) {
        tokens.set(tokenKey, expires);
      },
      async get(tokenKey) {
        const expires = tokens.get(tokenKey);
        if (!expires) {
          return null;
        }
        if (expires <= Date.now()) {
          tokens.delete(tokenKey);
          return null;
        }
        return expires;
      },
      async delete(tokenKey) {
        tokens.delete(tokenKey);
      },
      async deleteExpired() {
        const now = Date.now();
        tokens.forEach((expires, tokenKey) => {
          if (expires <= now) {
            tokens.delete(tokenKey);
          }
        });
      },
    },
  },
});

export async function validateCapToken(token: string | null | undefined, options?: Parameters<typeof cap.validateToken>[1]) {
  if (!token) {
    return { success: false };
  }

  try {
    return await cap.validateToken(token, options);
  } catch (error) {
    console.error('Cap token validation error:', error);
    return { success: false };
  }
}

export async function createCapChallenge() {
  return cap.createChallenge();
}

export async function redeemCapChallenge(payload: { token: string; solutions: number[] }) {
  return cap.redeemChallenge(payload);
}
