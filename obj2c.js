fs = require('fs')

var filename = process.argv[2];
var modelName = filename.replace('.obj', '');
var wrapConstantName = modelName.toUpperCase() + '_WRAP';
var vertexes = [];
var faces = [];
var textureCoords = [];

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
				v: Math.round(line[2]*31)
			});
		}
		if(type == 'f') {	// faces

			var faceA = line[1].split('/');
			var faceB = line[2].split('/');
			var faceC = line[3].split('/');

			faces.push({
				a: faceA[0]-1,
				b: faceB[0]-1,
				c: faceC[0]-1
			});

			vertexes[faceA[0]-1].uv = textureCoords[faceA[1]-1];
			vertexes[faceB[0]-1].uv = textureCoords[faceB[1]-1];
			vertexes[faceC[0]-1].uv = textureCoords[faceC[1]-1];
		}
	}

}

function printLog() {
	console.log('number of vertices: ' + vertexes.length);
	console.log('number of faces: ' + faces.length);
}

function exportData() {
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

	console.log(TEMPLATE_GSP_VERTEX.format(modelName, vertexes.length));
	for(var iFace = 0; iFace < faces.length; iFace++) {
		var face = faces[iFace];
		console.log(TEMPLATE_FACE.format(face.a, face.b, face.c));
	}
}

fs.readFile(filename, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }

  parseObj(data);
  exportData();
  printLog();
});