export function erlangC(A,N){if(A<=0)return 0;if(N<=A)return 1;let sum=1,p=1;for(let k=1;k<N;k++){p*=A/k;sum+=p}p*=A/N;const last=p*N/(N-A);return last/(sum+last)}
export function serviceLevel(N,A,T,AHT){if(A<=0)return 1;if(N<=A)return 0;return 1-erlangC(A,N)*Math.exp(-(N-A)*T/AHT)}
export function asa(N,A,AHT){if(A<=0)return 0;if(N<=A)return Infinity;return erlangC(A,N)*AHT/(N-A)}
export function occupancy(A,N){return N>0?A/N:0}
export function staffInterval({volume,aht,intervalMinutes=30,slTarget=.8,slTime=30,occCap=.85,shrinkage=.25}){const hours=intervalMinutes/60;const A=(volume/hours)*aht/3600;if(volume<=0||aht<=0)return{A:0,N:0,sl:1,asa:0,occ:0,post:0};let N=Math.max(1,Math.floor(A)+1),guard=0;while(guard++<1000){const sl=serviceLevel(N,A,slTime,aht),occ=occupancy(A,N);if(sl>=slTarget&&(!occCap||occ<=occCap))break;N++}return{A,N,sl:serviceLevel(N,A,slTime,aht),asa:asa(N,A,aht),occ:occupancy(A,N),post:N/(1-shrinkage)}}
