#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
// uniform sampler2D uMainSampler;

varying vec2 fragCoord;

// float speed = time * 0.2;
// float pi = 3.14159265;

// void main( void ) {

//     vec2 position = vec2(512.0/2.0+512.0/2.0*sin(speed*2.0), 400.0/2.0+400.0/2.0*cos(speed*3.0));
//     vec2 position2 = vec2(512.0/2.0+512.0/2.0*sin((speed+2000.0)*2.0), 400.0/2.0+400.0/2.0*cos((speed+2000.0)*3.0));

//     vec2 offset = vec2(512.0/2.0, 400.0/2.0) ;
//     vec2 offset2 = vec2(6.0*sin(speed*1.1), 3.0*cos(speed*1.1));

//     vec2 oldPos = (gl_FragCoord.xy-offset);

//     float angle = speed*2.0;

//     vec2 newPos = vec2(oldPos.x *cos(angle) - oldPos.y *sin(angle),
//     oldPos.y *cos(angle) + oldPos.x *sin(angle));

//     newPos = (newPos)*(0.0044+0.004*sin(speed*3.0))-offset2;
//     vec2 temp = newPos;
//     newPos.x = temp.x + 0.4*sin(temp.y*2.0+speed*8.0);
//     newPos.y = (-temp.y + 0.4*sin(temp.x*2.0+speed*8.0));
//     vec4 final = texture2D(uMainSampler,newPos);
//     //final = texture2D(texCol,gl_FragCoord.xy*vec2(1.0/512, -1.0/400));
//     gl_FragColor = vec4(final.xyz, 1.0);

// }

// Star Nest by Pablo Roman Andrioli

// This content is under the MIT License.

#define iterations 17
#define formuparam 0.53

#define volsteps 20
#define stepsize 0.1

#define zoom   0.800
#define tile   0.850
#define speed  0.010 

#define brightness 0.0015
#define darkmatter 0.300
#define distfading 0.730
#define saturation 0.850


void main(void) {

	//get coords and direction
	vec2 uv=fragCoord.xy/resolution.xy-.5;
	uv.y*=resolution.y/resolution.x;
	vec3 dir=vec3(uv*zoom,1.);
	float tTime=time*speed+.25;

	//mouse rotation
	float a1=.5+mouse.x/resolution.x*2.;
	float a2=.8+mouse.y/resolution.y*2.;
	mat2 rot1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1));
	mat2 rot2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2));
	dir.xz*=rot1;
	dir.xy*=rot2;
	vec3 from=vec3(1.,.5,0.5);
	from+=vec3(tTime*2.,tTime,-2.);
	from.xz*=rot1;
	from.xy*=rot2;
	
	//volumetric rendering
	float s=0.1,fade=1.;
	vec3 v=vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) { 
			p=abs(p)/dot(p,p)-formuparam; // the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		if (r>6) fade*=1.-dm; // dark matter, don't render near
		//v+=vec3(dm,dm*.5,0.);
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	gl_FragColor = vec4(v*.01,1.);	
	
}