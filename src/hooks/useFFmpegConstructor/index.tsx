



function useFFmpegConstructor() {
  return {
    createCommand: (ac = 1, ar = 22050, af = '', outputType = 'wav') => {
      const valueIsInvalid =
        outputType === '' ||
        ac <= 0 ||
        ar <= 0 ||
        Number.isNaN(ac) ||
        Number.isNaN(ar);
      if (valueIsInvalid) {
        return '';
      }
      return `ffmpeg.exe -i "plikel.mp3" -ac ${ac} -ar ${ar} ${
        af ? `-af ${af}` : ''
      } plikel.${outputType}`;
    },
  };
}

export default useFFmpegConstructor;
