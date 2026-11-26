#!/bin/bash
# sheet.sh out.jpg files... : 4 per row, ~1400 px wide, frame number burned in
out=$1; shift
n=$#; args=(); i=0; filt=""
for f in "$@"; do args+=(-i "$f"); filt+="[$i:v]scale=340:-1,drawtext=fontfile=/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf:text='$(basename $f .jpg)':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6[v$i];"; i=$((i+1)); done
cols=4; rows=$(( (n+cols-1)/cols )); lay=""
for ((j=0;j<n;j++)); do x=$(( (j%cols)*340 )); y="$(( j/cols ))"; lay+="${x}_$(( y*605 ))|"; done
ins=""; for ((j=0;j<n;j++)); do ins+="[v$j]"; done
ffmpeg -y -v error "${args[@]}" -filter_complex "${filt}${ins}xstack=inputs=$n:layout=${lay%|}:fill=black" -frames:v 1 -q:v 3 "$out"
