import tensorflow as tf

hello = tf.constant('Hello Jubayer Miah')
sess = tf.Session()
print(sess.run(hello))