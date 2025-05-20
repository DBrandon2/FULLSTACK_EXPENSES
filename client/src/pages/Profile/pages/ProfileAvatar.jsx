import React, { useContext, useRef } from "react";
import { Camera, User } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";
import { updateAvatar } from "../../../apis/auth.api";
import { AuthContext } from "../../../context/AuthContext";

export default function ProfileAvatar({
  avatarUrl,
  isEditing,
  onChangeAvatar,
  id,
}) {
  // Bloque le rendu côté serveur (SSR)
  if (typeof window === "undefined") return null;

  // Référence pour input file
  const inputRef = useRef(null);
  const { setUser, user } = useContext(AuthContext);

  console.log("ProfileAvatar user:", user); // debug user

  const handleAvatarCLick = () => {
    if (isEditing && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e?.target?.files?.[0];

    if (!file || typeof file.name !== "string" || !file.name.includes(".")) {
      console.error("Fichier invalide ou sans extension :", file);
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: url } = await supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      if (!url?.publicUrl) {
        throw new Error("URL publique introuvable après upload");
      }

      await updateAvatar({ avatar: url.publicUrl, _id: id });
      onChangeAvatar(url.publicUrl);

      const storedUser =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user")) || {}
          : {};
      const updatedUser = { ...storedUser, avatar: url.publicUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error("Erreur lors du traitement de l'image :", err);
    }
  };

  // Source avatar sûre
  const avatarSrc =
    user?.avatar && user.avatar !== "undefined"
      ? user.avatar
      : avatarUrl && avatarUrl !== "undefined"
      ? avatarUrl
      : null;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative rounded-full overflow-hidden h-32 w-32 border-4 border-white shadow-lg transition duration-300 ${
          isEditing ? "cursor-pointer hover:opacity-90" : ""
        }`}
        onClick={handleAvatarCLick}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <User size={64} className="text-gray-400" />
          </div>
        )}

        {isEditing && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <Camera size={36} className="text-white" />
          </div>
        )}
      </div>

      {isEditing && (
        <>
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <p className="text-sm text-blue-500 mt-2">Click to change avatar</p>
        </>
      )}
    </div>
  );
}
