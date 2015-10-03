var PNG = require('png-js');

var filename = process.argv[2];
var textureName = filename.replace('.png', '');
var myimage = new PNG.load(process.argv[2]);

var width  = myimage.width;
var height = myimage.height;

myimage.decode(function (data) {
	console.log('unsigned short ' + textureName + '[] = {');
     for (var y = 0; y < height; y++) {
     		var row = '';
            for (var x = 0; x < width; x++) {
                var idx = (width * y + x) << 2;
               
                
                var pixel = convertTo5Bit({
					red: data[idx],
                	green: data[idx+1],
                	blue: data[idx+2],
                	alpha: data[idx+3]
                });

                // invert color
                
                var value = 0;
                value |= (pixel.red & 0xFF)<<11;
                value |= (pixel.green & 0xFF)<<6;
                value |= (pixel.blue & 0xFF)<<1;
                value |= pixel.alpha;
                row += '0x' + value.toString(16) + ' ,';
            }
            console.log(row);
        }
        console.log('};');
});

function convertTo5Bit(pixel) {
	result= {};
	result.red = parseInt(pixel.red*31/255);
	result.green = parseInt(pixel.green*31/255);
	result.blue = parseInt(pixel.blue*31/255);
	if(pixel.alpha > 0) {
		result.alpha = 1;
	}
	else {
		result.alpha = 0;
	}
	return result;
}