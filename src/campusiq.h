#ifndef CAMPUSIQ_H
#define CAMPUSIQ_H
#define MAX_NODES 16
#define MAX_EDGES 48
#define MAX_PATH MAX_NODES
typedef struct { int id; const char *name; const char *kind; const char *room; const char *course; double x,y; } Node;
typedef struct { int from,to,distance; const char *road; int stairs; int accessible; int crowd; } Edge;
typedef struct { int node_ids[MAX_PATH]; int count; int distance; int cost; } Route;
extern const Node NODES[]; extern const int NODE_COUNT;
extern const Edge EDGES[]; extern const int EDGE_COUNT;
int find_node_by_id(const char *id); int find_edge(int from,int to);
const char *node_id(int index); const char *node_name(int index);
const char *node_kind(int index); const char *node_room(int index); const char *node_course(int index);
const char *edge_road(int from,int to); int edge_distance(int from,int to);
int edge_stairs(int from,int to); int edge_accessible(int from,int to); int edge_crowd(int from,int to);
int shortest_route(int start,int destination,Route *route,int accessible,int crowd_aware,const int *closed_edges,int closed_count);
#endif
