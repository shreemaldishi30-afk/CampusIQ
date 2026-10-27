#define _POSIX_C_SOURCE 200809L
#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>
#include <pthread.h>
#include "campusiq.h"
#define PORT 8080
#include <time.h>
#define REQUEST_SIZE 24000
#define BODY_SIZE 14000
static void write_all(int c,const char *buf,size_t len){size_t sent=0;while(sent<len){ssize_t n=write(c,buf+sent,len-sent);if(n<0){if(errno==EINTR)continue;return;}if(n==0)return;sent+=(size_t)n;}}
static void send_response(int c,int status,const char *label,const char *type,const char *body){char h[1024];size_t len=strlen(body);int n=snprintf(h,sizeof h,"HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %zu\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",status,label,type,len);if(n>0)write_all(c,h,(size_t)n);write_all(c,body,len);}
static int get_string(const char *body,const char *key,char *out,size_t cap){char pat[80];snprintf(pat,sizeof pat,"\"%s\"",key);const char *p=strstr(body,pat);if(!p)return 0;p=strchr(p+strlen(pat),':');if(!p)return 0;p++;while(*p==' '||*p=='\n'||*p=='\t')p++;if(*p!='\"')return 0;p++;const char *end=strchr(p,'\"');if(!end)return 0;size_t n=(size_t)(end-p);if(!n||n>=cap)return 0;memcpy(out,p,n);out[n]=0;return 1;}
static int get_bool(const char *body,const char *key){char pat[80];snprintf(pat,sizeof pat,"\"%s\"",key);const char *p=strstr(body,pat);if(!p)return 0;p=strchr(p,':');if(!p)return 0;p++;while(*p==' '||*p=='\t')p++;return strncmp(p,"true",4)==0;}
static int get_int_array(const char *body,const char *key,int *out,int max){char pat[80];snprintf(pat,sizeof pat,"\"%s\"",key);const char *p=strstr(body,pat);if(!p)return 0;p=strchr(p,':');if(!p)return 0;p=strchr(p,'[');if(!p)return 0;p++;int n=0;while(*p&&*p!=']'&&n<max){while(*p==' '||*p=='\t'||*p=='\n'||*p==',')p++;if(*p==']'||!*p)break;if(*p=='\"'){p++;char *end;long v=strtol(p,&end,10);if(end==p)break;out[n++]=(int)v;p=strchr(end,'\"');if(!p)break;p++;}else{char *end;long v=strtol(p,&end,10);if(end==p)break;out[n++]=(int)v;p=end;}}return n;}
static void send_locations(int c){char j[8000];size_t u=(size_t)snprintf(j,sizeof j,"{\"locations\":[");for(int i=0;i<NODE_COUNT;i++)u+=(size_t)snprintf(j+u,sizeof j-u,"%s{\"id\":\"%s\",\"name\":\"%s\",\"kind\":\"%s\",\"room\":\"%s\",\"course\":\"%s\",\"x\":%.0f,\"y\":%.0f}",i?",":"",node_id(i),node_name(i),node_kind(i),node_room(i),node_course(i),NODES[i].x,NODES[i].y);snprintf(j+u,sizeof j-u,"]}");send_response(c,200,"OK","application/json; charset=utf-8",j);}
static void send_route(int c,const char *body){char a[32],b[32];if(!get_string(body,"start",a,sizeof a)||!get_string(body,"destination",b,sizeof b)){send_response(c,400,"Bad Request","application/json","{\"error\":\"Provide start and destination IDs.\"}");return;}int start=find_node_by_id(a),dest=find_node_by_id(b);if(start<0||dest<0){send_response(c,400,"Bad Request","application/json","{\"error\":\"Unknown location ID.\"}");return;}int closed[MAX_EDGES];int closed_n=get_int_array(body,"closedEdges",closed,MAX_EDGES);int accessible=get_bool(body,"accessible"),crowd=get_bool(body,"crowdAware");
 int stops[MAX_NODES],stop_n=get_int_array(body,"stops",stops,MAX_NODES);int itinerary[MAX_NODES+2],it_n=0;itinerary[it_n++]=start;for(int i=0;i<stop_n;i++)if(stops[i]>=0&&stops[i]<NODE_COUNT&&stops[i]!=start&&stops[i]!=dest&&it_n<MAX_NODES)itinerary[it_n++]=stops[i];itinerary[it_n++]=dest;
 Route combined;combined.count=0;combined.distance=0;combined.cost=0;int ok=1;
 for(int s=0;s<it_n-1;s++){Route part;if(!shortest_route(itinerary[s],itinerary[s+1],&part,accessible,crowd,closed,closed_n)){ok=0;break;}for(int k=0;k<part.count;k++){if(combined.count&&k==0)continue;if(combined.count<MAX_PATH)combined.node_ids[combined.count++]=part.node_ids[k];}combined.distance+=part.distance;combined.cost+=part.cost;}
 if(!ok){send_response(c,404,"Not Found","application/json","{\"error\":\"No route fits the selected accessibility and closure settings. Try reopening a path or changing preferences.\"}");return;}
 char j[BODY_SIZE];size_t u=0;int eta=(combined.distance+79)/80;u+=(size_t)snprintf(j+u,sizeof j-u,"{\"path\":[");for(int i=0;i<combined.count;i++){int n=combined.node_ids[i];u+=(size_t)snprintf(j+u,sizeof j-u,"%s{\"id\":\"%s\",\"name\":\"%s\",\"kind\":\"%s\",\"x\":%.0f,\"y\":%.0f}",i?",":"",node_id(n),node_name(n),node_kind(n),NODES[n].x,NODES[n].y);}
 u+=(size_t)snprintf(j+u,sizeof j-u,"],\"distance\":%d,\"etaMinutes\":%d,\"cost\":%d,\"crowdAware\":%s,\"accessible\":%s,\"steps\":[",combined.distance,eta,combined.cost,crowd?"true":"false",accessible?"true":"false");
 for(int i=0;i<combined.count-1;i++){int x=combined.node_ids[i],y=combined.node_ids[i+1],metres=edge_distance(x,y),crowdlevel=edge_crowd(x,y);const char *road=edge_road(x,y);u+=(size_t)snprintf(j+u,sizeof j-u,"%s{\"from\":\"%s\",\"to\":\"%s\",\"road\":\"%s\",\"distance\":%d,\"crowd\":%d,\"stairs\":%s,\"instruction\":\"Continue along %s toward %s for %d m\"}",i?",":"",node_name(x),node_name(y),road,metres,crowdlevel,edge_stairs(x,y)?"true":"false",road,node_name(y),metres);if(u>sizeof j-512)break;}
 snprintf(j+u,sizeof j-u,"]}");send_response(c,200,"OK","application/json; charset=utf-8",j);
}
static const char *ctype(const char *p){if(strstr(p,".html"))return "text/html; charset=utf-8";if(strstr(p,".css"))return "text/css; charset=utf-8";if(strstr(p,".js"))return "application/javascript; charset=utf-8";return "text/plain; charset=utf-8";}
static void static_file(int c,const char *url){const char *rel=strcmp(url,"/")==0?"/index.html":url;if(strstr(rel,"..")||strchr(rel,'\\')){send_response(c,400,"Bad Request","text/plain","Invalid path");return;}char p[512];snprintf(p,sizeof p,"public%s",rel);FILE *f=fopen(p,"rb");if(!f){send_response(c,404,"Not Found","text/plain","File not found");return;}/* Read the complete static asset; the campus directory JS can exceed 24 KB. */
 long file_size; if(fseek(f,0,SEEK_END)!=0){fclose(f);send_response(c,500,"Server Error","text/plain","Could not read asset");return;} file_size=ftell(f); if(file_size<0 || file_size>2000000 || fseek(f,0,SEEK_SET)!=0){fclose(f);send_response(c,500,"Server Error","text/plain","Asset size invalid");return;} char *body=malloc((size_t)file_size+1); if(!body){fclose(f);send_response(c,500,"Server Error","text/plain","Out of memory");return;} size_t n=fread(body,1,(size_t)file_size,f);fclose(f);body[n]=0;send_response(c,200,"OK",ctype(p),body);free(body);}

#define SHARE_SLOTS 64
typedef struct { int used; char session[40], name[40], client_id[80]; double lat, lon; int sharing; long updated; } ShareEntry;
static ShareEntry share_entries[SHARE_SLOTS];
static pthread_mutex_t share_mutex = PTHREAD_MUTEX_INITIALIZER;
static int get_double(const char *body,const char *key,double *out){char pat[80];snprintf(pat,sizeof pat,"\"%s\"",key);const char *p=strstr(body,pat);if(!p)return 0;p=strchr(p,':');if(!p)return 0;*out=strtod(p+1,NULL);return 1;}
static int get_number(const char *body,const char *key,long *out){double d;if(!get_double(body,key,&d))return 0;*out=(long)d;return 1;}
static void share_update(int c,const char *body){char session[40],name[40],client_id[80];double lat,lon;long sharing=0;if(!get_string(body,"session",session,sizeof session)||!get_string(body,"name",name,sizeof name)||!get_string(body,"clientId",client_id,sizeof client_id)||!get_double(body,"lat",&lat)||!get_double(body,"lon",&lon)){send_response(c,400,"Bad Request","application/json","{\"error\":\"Provide session, name, clientId, lat and lon.\"}");return;}get_number(body,"sharing",&sharing);pthread_mutex_lock(&share_mutex);int slot=-1;for(int i=0;i<SHARE_SLOTS;i++)if(share_entries[i].used&&!strcmp(share_entries[i].session,session)&&!strcmp(share_entries[i].client_id,client_id)){slot=i;break;}if(sharing==0){if(slot>=0)memset(&share_entries[slot],0,sizeof(share_entries[slot]));pthread_mutex_unlock(&share_mutex);send_response(c,200,"OK","application/json","{\"ok\":true,\"sharing\":false}");return;}if(slot<0)for(int i=0;i<SHARE_SLOTS;i++)if(!share_entries[i].used){slot=i;break;}if(slot<0){pthread_mutex_unlock(&share_mutex);send_response(c,503,"Busy","application/json","{\"error\":\"Session capacity reached.\"}");return;}ShareEntry *e=&share_entries[slot];e->used=1;snprintf(e->session,sizeof e->session,"%s",session);snprintf(e->name,sizeof e->name,"%s",name);snprintf(e->client_id,sizeof e->client_id,"%s",client_id);e->lat=lat;e->lon=lon;e->sharing=1;e->updated=(long)time(NULL);pthread_mutex_unlock(&share_mutex);send_response(c,200,"OK","application/json","{\"ok\":true}");}
static void share_peers(int c,const char *path){
 char session[40]="";const char *q=strstr(path,"session=");if(q){q+=8;size_t n=0;while(q[n]&&q[n]!='&'&&n<sizeof session-1){session[n]=q[n];n++;}session[n]=0;}
 char j[8000];size_t u=(size_t)snprintf(j,sizeof j,"{\"peers\":[");int count=0;long now=(long)time(NULL);
 pthread_mutex_lock(&share_mutex);
 for(int i=0;i<SHARE_SLOTS;i++){ShareEntry *e=&share_entries[i];if(e->used && now-e->updated>30){memset(e,0,sizeof(*e));continue;}if(!e->used||!e->sharing||strcmp(e->session,session))continue;
  u+=(size_t)snprintf(j+u,sizeof j-u,"%s{\"clientId\":\"%s\",\"name\":\"%s\",\"lat\":%.7f,\"lon\":%.7f,\"updated\":%ld}",count++?",":"",e->client_id,e->name,e->lat,e->lon,e->updated);if(u>sizeof j-300)break;
 }
 pthread_mutex_unlock(&share_mutex);snprintf(j+u,sizeof j-u,"]}");send_response(c,200,"OK","application/json; charset=utf-8",j);
}

static void handle(int c){
 char req[REQUEST_SIZE+1];size_t used=0,header_end=0,body_len=0;int have_header=0;
 while(used<REQUEST_SIZE){ssize_t n=read(c,req+used,REQUEST_SIZE-used);if(n<0){if(errno==EINTR)continue;return;}if(n==0)return;used+=(size_t)n;req[used]=0;
  if(!have_header){char *sep=strstr(req,"\r\n\r\n");if(sep){header_end=(size_t)(sep-req);have_header=1;const char *cl=strstr(req,"Content-Length:");if(cl){cl+=15;while(*cl==' '||*cl=='\t')cl++;char *end=NULL;long v=strtol(cl,&end,10);if(end!=cl&&v>=0)body_len=(size_t)v;if(header_end+4>REQUEST_SIZE || body_len>REQUEST_SIZE-header_end-4){send_response(c,413,"Payload Too Large","text/plain","Request body too large");return;}}}}
  if(have_header&&used>=header_end+4+body_len)break;
 }
 if(!have_header||used<header_end+4+body_len){send_response(c,400,"Bad Request","text/plain","Incomplete request");return;}req[used]=0;
 char method[16]={0},path[256]={0};if(sscanf(req,"%15s %255s",method,path)!=2){send_response(c,400,"Bad Request","text/plain","Malformed request");return;}
 if(strcmp(method,"GET")==0&&strcmp(path,"/api/locations")==0){send_locations(c);return;}
 if(strcmp(method,"GET")==0&&strncmp(path,"/api/peers?",10)==0){share_peers(c,path);return;}
 if(strcmp(method,"POST")==0&&strcmp(path,"/api/share")==0){char *body=strstr(req,"\r\n\r\n");if(!body){send_response(c,400,"Bad Request","application/json","{}");return;}share_update(c,body+4);return;}
 if(strcmp(method,"POST")==0&&strcmp(path,"/api/route")==0){char *body=strstr(req,"\r\n\r\n");if(!body){send_response(c,400,"Bad Request","application/json","{\"error\":\"Missing request body\"}");return;}send_route(c,body+4);return;}
 if(strcmp(method,"GET")==0){char *q=strchr(path,'?');if(q)*q=0;static_file(c,path);return;}
 send_response(c,404,"Not Found","text/plain","Endpoint not found");
}
static void *client_thread(void *arg){int c=*(int*)arg;free(arg);handle(c);close(c);return NULL;}
int main(void){signal(SIGPIPE,SIG_IGN);int s=socket(AF_INET,SOCK_STREAM,0);if(s<0){perror("socket");return 1;}int yes=1;setsockopt(s,SOL_SOCKET,SO_REUSEADDR,&yes,sizeof yes);struct sockaddr_in a;memset(&a,0,sizeof a);a.sin_family=AF_INET;a.sin_addr.s_addr=htonl(INADDR_ANY);a.sin_port=htons(PORT);if(bind(s,(struct sockaddr*)&a,sizeof a)<0){perror("bind");return 1;}if(listen(s,16)<0){perror("listen");return 1;}printf("CampusIQ v2 running at http://localhost:%d\n",PORT);printf("Demo data only; Ctrl+C to stop.\n");for(;;){int c=accept(s,NULL,NULL);if(c<0){if(errno==EINTR)continue;perror("accept");continue;}int *client=malloc(sizeof(int));if(!client){close(c);continue;}*client=c;pthread_t th;if(pthread_create(&th,NULL,client_thread,client)!=0){free(client);close(c);continue;}pthread_detach(th);}close(s);return 0;}
