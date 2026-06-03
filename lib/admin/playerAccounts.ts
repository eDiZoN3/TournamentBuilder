import { PlayerProfile, type IPlayerProfile } from "@/lib/models/PlayerProfile";
import { User } from "@/lib/models/User";

export interface PlayerUserSummary {
  _id: string;
  createdAt: string;
  displayName: string;
  email: string;
  firstName: string;
  mustChangePassword: boolean;
  surname?: string;
  userId: string;
}

interface UserForSummary {
  _id: { toString(): string };
  mustChangePassword: boolean;
}

export function displayName(firstName: string, surname?: string): string {
  return [firstName, surname].filter(Boolean).join(" ");
}

export function playerSummary(
  profile: IPlayerProfile,
  user: UserForSummary,
): PlayerUserSummary {
  return {
    _id: profile._id.toString(),
    userId: profile.userId.toString(),
    firstName: profile.firstName,
    surname: profile.surname ?? undefined,
    displayName: profile.displayName,
    email: profile.email,
    mustChangePassword: user.mustChangePassword,
    createdAt: profile.createdAt.toISOString(),
  };
}

export async function getPlayerUserSummaries(): Promise<PlayerUserSummary[]> {
  const profiles = await PlayerProfile.find().sort({ createdAt: -1 });
  const users = await User.find({
    _id: {
      $in: profiles.map((profile) => profile.userId),
    },
    role: "player",
  });
  const usersById = new Map(
    users.map((user) => [user._id.toString(), user]),
  );

  return profiles.flatMap((profile) => {
    const user = usersById.get(profile.userId.toString());

    return user ? [playerSummary(profile, user)] : [];
  });
}
