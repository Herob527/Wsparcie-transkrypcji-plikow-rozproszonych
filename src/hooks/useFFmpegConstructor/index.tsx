import { useState, useEffect } from "react";

import {
  useQueryClient,
  QueryClientProvider,
  useQuery,
  QueryClient,
} from "react-query";

function useFFmpegConstructor() {
  return {
    createCommand: (
      ac: number = 1,
      ar: number = 22050,
      af: string = "",
      output_type: string = "wav"
    ) => {
      const valueIsInvalid =
        output_type === "" ||
        ac <= 0 ||
        ar <= 0 ||
        Number.isNaN(ac) ||
        Number.isNaN(ar);
      if (valueIsInvalid) {
        return "";
      }
      return `ffmpeg.exe -i "plikel.mp3" -ac ${ac} -ar ${ar} ${
        af ? "-af " + af : ""
      } plikel.${output_type}`;
    },
  };
}

export default useFFmpegConstructor;
