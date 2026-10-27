#include <stdio.h>
#include <string.h>
#include "campusiq.h"
/* Schematic demo data only. Names/rooms/course mappings and coordinates must be verified against MUJ's official campus map and timetable before real deployment. */
const Node NODES[] = {
 {0,"Main Gate","Entrance","—","—",70,280},
 {1,"Library","Facility","—","—",220,220},
 {2,"Central Plaza","Landmark","—","—",360,280},
 {3,"Academic Block","Building","Demo room A-101","DEMO101",500,180},
 {4,"Computer Science Block","Building","Demo room CS-204","DEMO201",650,220},
 {5,"Cafeteria","Facility","—","—",390,410},
 {6,"Sports Complex","Facility","—","—",590,430},
 {7,"Administration Office","Office","—","—",210,390},
 {8,"Computer Lab (demo)","Lab","Demo lab CS-L1","DEMO-LAB",585,105},
 {9,"Lecture Hall (demo)","Classroom","Demo room LH-2","DEMO202",475,350},
 {10,"Student Services (demo)","Office","—","—",100,410}
};
const int NODE_COUNT=(int)(sizeof(NODES)/sizeof(NODES[0]));
/* Edge fields: endpoints, metres, path name, stairs?, accessible?, sample crowd level 0-3. */
const Edge EDGES[]={
 {0,1,180,"Gate Walk",0,1,1},{0,7,210,"Campus Road",0,1,1},{1,2,160,"Library Walk",0,1,2},
 {1,7,190,"West Path",1,0,0},{2,3,190,"Academic Avenue",0,1,2},{2,5,140,"Plaza Walk",0,1,3},
 {2,4,360,"East Walk",0,1,1},{3,4,170,"Tech Avenue",0,1,2},{3,6,300,"North Sports Road",1,0,1},
 {4,6,230,"East Campus Road",0,1,1},{5,6,220,"Sports Walk",0,1,1},{7,5,240,"Admin Walk",0,1,0},
 {1,3,350,"Library Avenue",0,1,1},{3,8,150,"CS Lab Connector",1,0,1},{4,8,180,"East Lab Walk",0,1,1},
 {2,9,210,"Lecture Hall Walk",0,1,2},{5,9,190,"South Lecture Path",0,1,1},{7,10,130,"Services Path",0,1,0},
 {0,10,250,"South Gate Path",0,1,1},{9,6,210,"Sports Link",0,1,1}
};
const int EDGE_COUNT=(int)(sizeof(EDGES)/sizeof(EDGES[0]));
int find_node_by_id(const char *id){if(!id)return -1;for(int i=0;i<NODE_COUNT;i++){char b[16];snprintf(b,sizeof b,"%d",NODES[i].id);if(strcmp(id,b)==0)return i;}return -1;}
int find_edge(int a,int b){for(int i=0;i<EDGE_COUNT;i++)if((EDGES[i].from==a&&EDGES[i].to==b)||(EDGES[i].from==b&&EDGES[i].to==a))return i;return -1;}
const char *node_id(int i){static char ids[MAX_NODES][16];if(i<0||i>=NODE_COUNT)return "";snprintf(ids[i],sizeof ids[i],"%d",NODES[i].id);return ids[i];}
const char *node_name(int i){return i>=0&&i<NODE_COUNT?NODES[i].name:"";}
const char *node_kind(int i){return i>=0&&i<NODE_COUNT?NODES[i].kind:"";}
const char *node_room(int i){return i>=0&&i<NODE_COUNT?NODES[i].room:"";}
const char *node_course(int i){return i>=0&&i<NODE_COUNT?NODES[i].course:"";}
const char *edge_road(int a,int b){int e=find_edge(a,b);return e<0?"Campus Path":EDGES[e].road;}
int edge_distance(int a,int b){int e=find_edge(a,b);return e<0?0:EDGES[e].distance;}
int edge_stairs(int a,int b){int e=find_edge(a,b);return e<0?0:EDGES[e].stairs;}
int edge_accessible(int a,int b){int e=find_edge(a,b);return e<0?0:EDGES[e].accessible;}
int edge_crowd(int a,int b){int e=find_edge(a,b);return e<0?0:EDGES[e].crowd;}
static int is_closed(int edge,const int *closed,int count){for(int i=0;i<count;i++)if(closed[i]==edge)return 1;return 0;}
int shortest_route(int start,int destination,Route *route,int accessible,int crowd_aware,const int *closed_edges,int closed_count){
 if(!route||start<0||destination<0||start>=NODE_COUNT||destination>=NODE_COUNT)return 0;
 const int INF=1000000000;int dist[MAX_NODES],physical[MAX_NODES],prev[MAX_NODES],seen[MAX_NODES]={0};
 for(int i=0;i<NODE_COUNT;i++){dist[i]=INF;physical[i]=INF;prev[i]=-1;}dist[start]=0;physical[start]=0;
 for(int k=0;k<NODE_COUNT;k++){
  int u=-1;for(int i=0;i<NODE_COUNT;i++)if(!seen[i]&&(u<0||dist[i]<dist[u]))u=i;
  if(u<0||dist[u]>=INF)break;if(u==destination)break;seen[u]=1;
  for(int e=0;e<EDGE_COUNT;e++){
   if(is_closed(e,closed_edges,closed_count))continue;
   int v=-1;if(EDGES[e].from==u)v=EDGES[e].to;else if(EDGES[e].to==u)v=EDGES[e].from;
   if(v<0||seen[v])continue;if(accessible&&(!EDGES[e].accessible||EDGES[e].stairs))continue;
   int penalty=crowd_aware?EDGES[e].crowd*90:0;int next=dist[u]+EDGES[e].distance+penalty;
   if(next<dist[v]){dist[v]=next;physical[v]=physical[u]+EDGES[e].distance;prev[v]=u;}
  }
 }
 if(dist[destination]>=INF)return 0;int rev[MAX_PATH],n=0,u=destination;
 while(u!=-1&&n<MAX_PATH){rev[n++]=u;if(u==start)break;u=prev[u];}
 if(!n||rev[n-1]!=start)return 0;route->count=n;route->distance=physical[destination];route->cost=dist[destination];for(int i=0;i<n;i++)route->node_ids[i]=rev[n-1-i];return 1;
}
