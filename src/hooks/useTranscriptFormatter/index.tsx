import formatterData from "../../../src/transcription_example_data.json";

function useTranscriptFormatter() {
  const transcription_options = formatterData["data"];
  const transcription_options_map = new Map();
  for (let val in transcription_options) {
    // @ts-ignore
    transcription_options_map.set(val, transcription_options[val]);
  }

  return {
    format: (value: string) => {
      let newVal = value;
      for (let [key, val] of transcription_options_map.entries()) {
        newVal = newVal.replaceAll(`{${key}}`, val["example_value"]);
      }
      console.log(newVal);
      return newVal;
    },
  };
}

export default useTranscriptFormatter;
