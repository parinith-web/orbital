"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";
import type { User } from "@/lib/types";



export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);
  return {
    user: user as User | null,
    isLoading: user === undefined,
  };
}

interface UseUserProfileActionsResult {
  changeName: (username: string) => Promise<any>;
  changeAvatar: (avatarUrl: string) => Promise<any>;
  generateUploadUrl: () => Promise<string>;
  getUrl: (storageId: string) => Promise<string | null>;
  deleteUserAccount: () => Promise<any>;
}

export function useUserProfileActions(): UseUserProfileActionsResult & { createUser: (args: { username: string; avatar?: string }) => Promise<any> } {
  const changeNameMutation = useMutation(api.users.changeName);
  const changeAvatarMutation = useMutation(api.users.changeAvatar);
  const createUserMutation = useMutation(api.users.createUser);
  const generateUploadUrlMutation = useMutation(api.storage.generateUploadUrl);
  const getUrlMutation = useMutation(api.storage.getUrlMutation);
  const deleteUserAccountMutation = useMutation(api.users.deleteUserAccount);

  const createUser = useCallback(
    async (args: { username: string; avatar?: string }) => {
      return await createUserMutation(args);
    },
    [createUserMutation]
  );

  const changeName = useCallback(
    async (username: string) => {
      return await changeNameMutation({ username });
    },
    [changeNameMutation]
  );

  const changeAvatar = useCallback(
    async (avatarUrl: string) => {
      return await changeAvatarMutation({ avatarUrl });
    },
    [changeAvatarMutation]
  );

  const generateUploadUrl = useCallback(async () => {
    const url = await generateUploadUrlMutation();
    return url;
  }, [generateUploadUrlMutation]);

  const getUrl = useCallback(
    async (storageId: string) => {
      const result = await getUrlMutation({ storageId: storageId as Id<"_storage"> });
      return result ?? null;
    },
    [getUrlMutation]
  );

  const deleteUserAccount = useCallback(
    async () => {
      return await deleteUserAccountMutation();
    },
    [deleteUserAccountMutation]
  );

  return {
    changeName,
    changeAvatar,
    generateUploadUrl,
    getUrl,
    createUser,
    deleteUserAccount,
  };
}