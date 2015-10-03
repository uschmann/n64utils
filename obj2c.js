fs = require('fs')

var filename = process.argv[2];
var modelName = filename.replace('.obj', '');
var wrapConstantName = modelName.toUpperCase() + '_WRAP';
var vertexes = [];
var faces = [];
var textureCoords = [];
var vertOut = [];

  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function parseObj(str) {
	var lines = str.split("\n");
	for(var iLine = 0; iLine < lines.length; iLine++) {
		var line = lines[iLine].split(' ');
		var type = line[0];

		if(type == 'v') {	// Vertex
			vertexes.push({
				x: line[1],
				y: line[2],
				z: line[3]
			});
		}
		if(type == 'vt') {	// Texture coordinate
			textureCoords.push({
				u: Math.round(line[1]*31),
				v: Math.round(31 - line[2]*31)
			});
		}
		if(type == 'f') {	// faces

			var faceA = line[1].split('/');
			var faceB = line[2].split('/');
			var faceC = line[3].split('/');

			faces.push([
				{
					vertex: vertexes[faceA[0]-1],
					uv: textureCoords[faceA[1]-1]
				},
				{
					vertex: vertexes[faceB[0]-1],
					uv: textureCoords[faceB[1]-1]
				},
				{
					vertex: vertexes[faceC[0]-1],
					uv: textureCoords[faceC[1]-1]
				}
			]);
		}
	}
}

function printLog() {
	console.log('// number of vertices: ' + faces.length * 3);
	console.log('// number of faces: ' + faces.length);
}

function exportDataOld() {
	var TEMPLATE_VERTEX_STRUCT = 'static Vtx {0}_vtx[] =  {';
	var TEMPLATE_VERTEX = '\t{ {0}, {1}, {2}, 0, {6}<<{8}, {7}<<{8}, {3}, {4}, {5},0xff},';
	var TEMPLATE_GSP_VERTEX = '\tgSPVertex(glistp++,&({0}_vtx[0]), {1}, 0);'
	var TEMPLATE_FACE = '\tgSP1Triangle(glistp++, {0}, {1}, {2},0);';
	var SCALAR = 5;

	// export vertexes
	console.log('/*');
	console.log('\t6: once');
	console.log('\t7: twice');
	console.log('\t8: four times');
	console.log('\t9: eight times');
	console.log('\t10: sixteen times');
	console.log('*/');
	console.log('#define ' + wrapConstantName + ' 6');
	console.log(TEMPLATE_VERTEX_STRUCT.format(modelName));
	for(var iVertex = 0; iVertex < vertexes.length; iVertex++) {
		var texCoord = textureCoords[iVertex];
		var vertex = vertexes[iVertex];
		console.log(TEMPLATE_VERTEX.format(vertex.x*SCALAR, vertex.y*SCALAR, vertex.z*SCALAR, getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255), vertex.uv.u, vertex.uv.v, wrapConstantName));
	}
	console.log('};');

	// faces
	console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexes.length));
	for(var iFace = 0; iFace < faces.length; iFace++) {
		var face = faces[iFace];
		console.log(TEMPLATE_FACE.format(face.a, face.b, face.c));
	}
}

function exportData() {
	var TEMPLATE_VERTEX_STRUCT = 'static Vtx {0}_vtx[] =  {';
	var TEMPLATE_VERTEX = '\t{ {0}, {1}, {2}, 0, {6}<<{8}, {7}<<{8}, {3}, {4}, {5},0xff},';
	var TEMPLATE_GSP_VERTEX = '\tgsSPVertex(&({0}_vtx[{1}]), {2}, 0),'
	var TEMPLATE_FACE = '\tgsSP1Triangle({0}, {1}, {2},0),';
	var SCALAR = 5;

	// export vertexes
	console.log('/*');
	console.log('\t6: once');
	console.log('\t7: twice');
	console.log('\t8: four times');
	console.log('\t9: eight times');
	console.log('\t10: sixteen times');
	console.log('*/');
	console.log('#define ' + wrapConstantName + ' 6');
	console.log(TEMPLATE_VERTEX_STRUCT.format(modelName));
	for(var iFaces = 0; iFaces < faces.length; iFaces++) {
		var face = faces[iFaces];
		for(var iVertex = 0; iVertex < 3; iVertex++) {
			var vertex = face[iVertex].vertex;
			var uv = face[iVertex].uv;
			console.log(TEMPLATE_VERTEX.format(vertex.x*SCALAR, vertex.y*SCALAR, vertex.z*SCALAR, getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255), uv.u, uv.v, wrapConstantName));
		}
	}
	console.log('};');
	console.log();

	// display list
	var MAX_VERTEXES = 15;
	var vertexOffset = 0;
	var currentVertex = 0;
	console.log('Gfx ' + modelName + '_mdl[] = {');
	if(faces.length * 3 < 15) {
		console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexOffset, faces.length * 3));
	}
	else {
		console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexOffset, 15));
	}
	
	for(var iFace = 0; iFace < faces.length; iFace++) {
		console.log(TEMPLATE_FACE.format(currentVertex, currentVertex + 1, currentVertex + 2));
		vertexOffset += 3;
		currentVertex += 3;
		if(currentVertex == 15) {
			currentVertex = 0;
			if(faces.length * 3 - vertexOffset < 15) {
				console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexOffset, faces.length * 3 - vertexOffset));
			}
			else {
				console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexOffset, 15));
			}
		}
	}
	console.log('gsSPEndDisplayList()');
	console.log('};');
}

fs.readFile(filename, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }

  parseObj(data);
    printLog();
  exportData();
});