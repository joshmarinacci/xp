
# AutoKey language features

It should be possible to write code without using the shift key or caps lock
you should be able to write with just a text editor, not an IDE.

* start with a simple version that can be translated directly to javascript.
* liberal use of lambdas. ignore types, ignore most of the syntax sugar
* convert boolean ops like - and * into functions that can handle lists correctly
* builtins for
    * Rect
    * Vector
    * Point
    * Screen
* common functions
    * range
    * every
    * map
    * wrap
    * clamp
    * ?i randi
    * ?f randf
* primitives:
  integer
  float
  boolean
  string using single quotes ''
* no syntax for lists or objects yet. do it manually through function calls
* make lots of unit tests
  * pass if parsing works
  * pass if evaluates to the right answer

* add sugar for pipeline operator. implement it by rewriting the AST
* add sugar for - and + by rewriting the AST. start with the actual function names
* add a pretty printer which uses glyphs for things like theta and random
* all functions can have keyword arguments



# ============ the basics =============== #

// make a color
```javascript
test('Color(0,0,0)', [0,0,0])
```

```javascript
// add four and five
test('add(4,5)',9)
// loop ten times
test(`range(10).forEach(()=>{ print("hello") })`,"")
//
```

```javascript
let prelude = `
black = [0,0,0]
red = [1,0,0]
...
palette = [black, red,green,blue,cyan,yellow,purple,white]
function MakeDot() {
let dot = MakeObject()
dot.xy = Point(randi(0,screen.width), randi(0,1))
dot.v =  Vector(randf(-0.1,0.1), randf(0.5,1.5))
dot.color = chooseIndex(palette)
}
dots = range(20).map(()=>MakeDot())
dots[0].xy = Point(1,2)
dots[0].v = Vector(1,2)
`
test(prelude,'dots.length == 20',true)
test(prelude,'palette.get(2)`,[0,1,0])
test(prelude,'dots.get(0).xy`,[1,2])
test(prelude,'add(dots.get(0).xy,dots.get(0).v)',[2,4])
```


# types

you can define custom objects or 'classes'

```
type Rect {
    x:0
    y:0
    xy <= [self.x, self.y]
    w:0
    h:0
    size <= [self.w, self.h]
    wc <= (self.x + self.w)/2  # Width Center
    hc <= (self.y + self.h)/2  # Height Center
    left: _.x
    right: <= (_.x + _.w)
    top: _.y
    bottom: <= (_.y + _.h)
    center <= [_.wcenter, _.hcenter]
    split: @(sw,sh) {
        # the code to do the actual splitting
        # returns four new rects
    }
}
```
