import { useEffect, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { API_URL } from "../config/constants";

export async function fetchPrivateFile(
  filename: string,
  signal?: AbortSignal,
): Promise<Blob> {
  filename = filename.split("/").pop() || "";
  const token = localStorage.getItem("webarco_auth_token");
  if (!token) throw new Error("Debe iniciar sesión");
  const response = await fetch(
    `${API_URL}/upload/${encodeURIComponent(filename)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );
  if (!response.ok) throw new Error("No se pudo obtener el archivo privado");
  return response.blob();
}

export async function downloadPrivateFile(filename: string) {
  const blob = await fetchPrivateFile(filename);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PrivateImage({
  src: filename,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setSrc(undefined);
    if (filename?.startsWith("data:image/")) {
      setSrc(filename);
      return () => controller.abort();
    }
    if (filename)
      fetchPrivateFile(filename, controller.signal)
        .then((blob) => {
          if (controller.signal.aborted) return;
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        })
        .catch(() => undefined);
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename]);
  return <img {...props} src={src} />;
}
