mkdir wavs
for %%f IN (*.ogg) do (
	echo "%%f"
	ffmpeg.exe -i "%%f" -af silenceremove=start_periods=1:stop_duration=0.5:start_threshold=-50dB:stop_periods=-1:stop_duration=0.5:stop_threshold=-50dB -ac 1 -ar 22050 "wavs/%%f.wav")


for %%f IN (*.ogg) do (
	copy wavs\%%f.wav %%f.wav /Y
)

for %%f IN (*.ogg) do (
	del %%f /F
)
rmdir wavs /S /Q