import { useMemo } from "react";
import { toast } from "sonner";
import { AvatarMaker } from "@/components/avatar";
import {
  type AvatarConfig,
  decodeAvatarConfig,
  isAvatarConfigCode,
} from "@/lib/avatar/options";
import { useUserStore } from "@/store/useUserStore";
import { useUserProfileActions } from "@/hooks";

// The in-Settings counterpart to the standalone /avatar-maker page. Reuses
// the same <AvatarMaker /> component so the picker UI, encoding, and
// randomize logic all stay in one place — this tab just wires Save to the
// signed-in user's Convex profile instead of navigating away.
export const AvatarTab = () => {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const { changeAvatar } = useUserProfileActions();

  const initialConfig: AvatarConfig | undefined = useMemo(() => {
    if (user?.avatar && isAvatarConfigCode(user.avatar)) {
      return decodeAvatarConfig(user.avatar);
    }
    return undefined;
  }, [user?.avatar]);

  const handleSave = async (_config: AvatarConfig, code: string) => {
    try {
      const result = await changeAvatar(code);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setUser({ ...user!, avatar: code });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to save avatar");
    }
  };

  return (
    <div className="flex flex-col items-center pt-2 md:pt-10 w-[90%] md:w-[70%] mx-auto pb-10">
      <AvatarMaker onSave={handleSave} initialConfig={initialConfig} />
    </div>
  );
};
