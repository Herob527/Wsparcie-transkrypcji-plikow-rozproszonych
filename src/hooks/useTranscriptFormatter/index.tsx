import formatterData from '../../../src/transcription_example_data.json';

function useTranscriptFormatter() {
  const transcriptionOptions = formatterData['data'];
  const transcriptionOptionsMap = new Map();
  for (const val in transcriptionOptions) {
    // @ts-ignore
    transcriptionOptionsMap.set(val, transcriptionOptions[val]);
  }

  return {
    'format': (value: string) => {
      let newVal = value;
      for (const [key, val] of transcriptionOptionsMap.entries()) {
        newVal = newVal.replaceAll(`{${key}}`, val['example_value']);
      }
      console.log(newVal);
      return newVal;
    },
  };
}

export default useTranscriptFormatter;
