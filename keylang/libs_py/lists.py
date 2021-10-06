from math import floor
def add(a,b):
    return binop(a,b, lambda a,b:a+b)
def subtract(a,b):
    return binop(a,b, lambda a,b:a-b)
def multiply(a,b):
    return binop(a,b, lambda a,b:a*b)
def divide(a,b):
    return binop(a,b, lambda a,b:a/b)
def equals(a,b):
    return binop(a,b, lambda a,b:a==b)
def greaterthanorequals(a,b):
    return binop(a,b, lambda a,b:a>=b)
def greaterthan(a,b):
    return binop(a,b, lambda a,b:a>b)

def binop(a,b,op):
    if isinstance(a,List) and isinstance(b,List):
        out = List()
        for aa,bb in zip(a.data,b.data):
            out.append(op(aa,bb))
        return out
    if not isinstance(a,List) and isinstance(b,List):
        out = List()
        for bb in b.data:
            out.append(op(a,bb))
        return out
    if isinstance(a,List) and not isinstance(b,List):
        out = List()
        for aa in a.data:
            out.append(op(aa,b))
        return out
    return op(a,b)


class List:
    def __init__(self, *args):
        self.data = []
        for val in args:
            self.data.append(val)
    def append(self,val):
        self.data.append(val)

    def get_length(self):
        return len(self.data)

    length = property(get_length)

    def get1(self, n):
        return self.data[n]
    def set1(self, n, v):
        self.data[n] = v

    def map(self, lam):
        data = List()
        for val in self.data:
            data.append(lam(val))
        return data

    def every(self, lam):
#         print("dots every count",len(self.data))
        for val in self.data:
            lam(val)
    def dump(self):
        print("List is",self.data)
    def toString(self):
        return ','.join(str(e) for e in self.data)

class MDArray:
    def __init__(self, shape):
        self.shape = shape
        w = shape.get1(0)
        h = shape.get1(1)
        self.length = w * h
        print("making MD array of shape",w,h, self.length)
        self.data = bytearray()
        for n in range(self.length):
            self.data.append(0)
    def fill(self, val):
        for n in range(self.length):
            self.data[n] = val
    def index(self, x,y):
        return x + y*self.shape.get1(0)
    def fromIndex(self, n):
        return (n%self.shape.get1(0), floor(n/self.shape.get1(0)))
    def set2(self, x,y,v):
        self.data[self.index(x,y)] = v
    def get2(self, x,y):
        return self.data[self.index(x,y)]
    def every(self, lam):
        for n in range(self.length):
            (x,y) = self.fromIndex(n)
            v = self.data[n]
            lam(v,x,y)


def listrange(min, max=None, step=1):
    if max == None:
        return listrange(0,min)
    data  = List()
    val = min
    while True:
        data.append(val)
        val = val + step
        if val >= max:
            break
    return data


# class Rect:
#     def __init__(self, x1, y1, x2, y2):
#         self.x1 = floor(x1)
#         self.y1 = floor(y1)
#         self.x2 = floor(x2)
#         self.y2 = floor(y2)
#         self.width = self.x2 - self.x1
#         self.height = self.y2 - self.y1
#
#     def split(self, dir, amount):
#         print("splitting",dir,amount)
#         if dir == 'h':
#             return [
#                 Rect(
#                     self.x1, self.y1,
#                     lerp(amount, self.x1, self.x2), self.y2,
#                     ),
#                 Rect(
#                     lerp(amount, self.x1, self.x2),self.y1,
#                     self.x2, self.y2,
#                     ),
#             ]
#         if dir == 'v':
#             return [
#                 Rect(
#                     self.x1, self.y1,
#                     self.x2, lerp(amount, self.y1, self.y2),
#                     ),
#                 Rect(
#                     self.x1, lerp(amount, self.y1, self.y2),
#                     self.x2, self.y2,
#                     ),
#             ]
#
#
def wrapop(val,min,max):
    if val < min:
        return val + (max-min)
    if val > max:
        return val - (max-min)
    return val

def wrap(val,min,max):
    if isinstance(val,List):
        out = List()
        for aa,bb,cc in zip(val.data,min.data,max.data):
            out.append(wrapop(aa,bb,cc))
        return out
    return wrapop(val,min,max)
