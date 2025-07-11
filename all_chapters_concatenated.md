BAYES, BITS & BRAINS - ALL CHAPTERS CONCATENATED
Generated on: Fri Jul 11 12:44:01 PM CEST 2025

################################################################################
PART: INTRO
################################################################################

=================================================================================
=================================================================================
CHAPTER: Riddles
FILE: 00-introduction.mdx
=================================================================================
=================================================================================

[ERROR: File public/00-introduction.mdx not found]


################################################################################
PART I: FOUNDATIONS
################################################################################

=================================================================================
=================================================================================
CHAPTER: Bayes & KL divergence
FILE: 01-kl_intro.mdx
=================================================================================
=================================================================================

# Bayes' rule & KL divergence <a id="quantifying-information"></a>

In this chapter, we'll discuss Bayes' rule and use it to introduce KL divergence.<Footnote>KL stands for Kullback and Leibler, two guys who came up with this in the 1950s, right after Claude Shannon dropped his [game-changing paper](https://en.wikipedia.org/wiki/A_Mathematical_Theory_of_Communication) about entropy that we cover in the next chapter. Here's the first exercise: Try saying "Kullback-Leibler divergence" three times fast. </Footnote>

<KeyTakeaway>
KL divergence measures how well a distribution $p$ is fitted by a model distribution $q$.
</KeyTakeaway>


## 🕵️ Bayes' rule

Let's review Bayes' rule—it's how you update your beliefs when you get new information. Here's a setup that we will try to understand very deeply in the next few chapters:

<Block headline = "Bayesian detective">
A detective holds a coin that might, or might not be rigged. To keep it simple, let's say there are only two options: it's either fair (50/50 for heads/tails) or it's biased toward tails (25/75 for heads/tails). 

A detective keeps flipping this coin hoping to learn the truth. 
</Block>

Let's see how Bayes' rule helps our detective. To use the rule, she needs a starting guess—a _prior_—for the probability of each hypothesis. Let's say that the detective think there's a 2/3 chance the coin is fair and 1/3 chance it's biased.

She flips the coin: $\textsf{H}$eads! This is evidence for the $\textsf{fair}$ hypothesis, since heads are more likely with a fair coin. 

Our detective can use Bayes' rule to calculate the new probability -- the _posterior_ -- that the coin is fair. At this point, let's have a quick refresher on how Bayes' rule works. 

The point of the rule is that if you have two events $A, B$, then you can write down the probability that _both_ $A$ and $B$ happens in two ways, using conditional probabilities: 
<Math displayMode={true} id = "simple-bayes" math = "P(A) P(B | A) = P(A \textrm{ and } B) = P(B) P(A | B)." />


For example, let's say that <Math math="A =" /> 'the coin is $\textsf{fair}$' and <Math math="B =" /> 'we flipped $\textsf{H}$eads'. Then, our detective is especially interested in the value of <Math math="P(\textsf{fair} | \textsf{H})" />: That's her posterior probability that the coin is fair, after she flipped heads. She can rearrange <EqRef id="simple-bayes" /> a bit to get:

<Math id="bayes-formula" displayMode={true} math='P(\textsf{fair} | \textsf{H}) = P(\textsf{H} | \textsf{fair}) \cdot \frac{ P(\textsf{fair})}{P(\textsf{H})}' />

{/*
Whenever I have to write this formula down, I never know what exactly is in the fraction on the right. That's because the point of the formula is $P(\textsf{fair} | \textsf{H})$ on the left-hand side and $P(\textsf{H} | \textsf{fair})$ on the right-hand side -- _the larger the probability of Heads under a hypothesis, the larger the posterior probability of the hypothesis once we flip them._
*/}

## ➗ Divide and conquer

Actually, I don't like the formula <EqRef id="bayes-formula" /> that much, since there's a different way to write it down that I find much more intuitive. 

To get the message though, we have to get used to think in [odds](https://en.wikipedia.org/wiki/Odds) instead of probabilities. Gamblers love this—instead of "1/3 chance of this, 2/3 chance of that," they say "odds are 1:2." Odds don't need to add to one (1:2 is the same as 2:4), which actually often comes pretty handy - it allows you to focus on the more important parts of the picture. If you have a bunch of nonnegative numbers and you multiply all of them by the same factor so that they sum up to one, it's called _normalization_. So, thinking with odds is like thinking with probabilities except you don't want to worry about normalization too much. 

With odds, Bayes' formula is super clean! First, let's take the formula <EqRef id="bayes-formula" /> and write it for the biased hypothesis: 
<Math id="bayes-formula-2" displayMode={true} math='P(\textsf{biased} | \textsf{H}) = P(\textsf{H} | \textsf{biased}) \cdot \frac{ P(\textsf{biased})}{P(\textsf{H})}' />

If we divide <EqRef id="bayes-formula" /> and <EqRef id="bayes-formula-2" />, we get this equation: 

<div className="math-display-large">
<Math id="bayes-odds" displayMode={true} math='\underbrace{\frac{P(\textsf{fair} | \textsf{H})}{P(\textsf{biased} | \textsf{H})}}_{\textrm{Posterior odds}} = \underbrace{\frac{P(\textsf{fair})}{P(\textsf{biased})}}_{\textrm{Prior odds}} \cdot \underbrace{\frac{P(\textsf{H} | \textsf{fair})}{P(\textsf{H} | \textsf{biased})}}_{\textrm{Likelihood ratio}}' />
</div>

This is actually a very relatable formula! <Math math = "\frac{P(\textsf{fair})}{P(\textsf{biased})}"/> is simply the _prior_ probability that our detective has on the two hypotheses, written as odds. I.e., if $P(\textsf{fair}) = 2/3$, this ratio is just $2:1$ or, if you want, $2$. 

The fraction <Math math = "\frac{P(\textsf{fair} | \textsf{H})}{P(\textsf{biased} | \textsf{H})}"/> on the left-hand side is pretty much the same - it is the _posterior_ probability, written as odds. 

Finally, there's the ratio <Math math = "\frac{P(\textsf{H} | \textsf{fair})}{P(\textsf{H} | \textsf{biased})}" />—that's how much more likely heads are under the $\textsf{fair}$ hypothesis. Conditional probabilities <Math math = "P(\textsf{event} | \textsf{hypothesis})" /> are typically called [_likelihoods_](https://en.wikipedia.org/wiki/Likelihood_function), so this ratio is the likelihood ratio.

Here's how it works in practice.  <Footnote>Getting Bayes' rule is super important. If this explanation is too fast, check out [this explainer](https://www.lesswrong.com/w/bayes-rule). </Footnote>
Applying Bayes' rule is as simple as 

1. Write down the prior odds
2. Multiply with likelihood ratios
3. Profit!

You can also test in the following widget that it works the same for more than two hypotheses (we won't explicitly need this right now, but it's good to know). 

<BayesCalculatorWidget />

In the concrete case of our detective, she increased her probability of fair coin from $66.7\%$ to $80\%$. Her suspicion that the coin is fair got boosted a bit. But it could also be a fluke. She has to flip the coin a few more times. 

{/*Bayes' theorem simply says we should do the simplest thing possible with the two relevant ratios -- multiply them -- to arrive at the posterior odds $P(\textsf{fair} | \textsf{H}) : P(\textsf{biased} | \textsf{H})$ .*/}

## ✖️ Go forth and multiply

Let's see what happens when our detective keeps flipping over and over, updating her beliefs each time using Bayes' rule. 
For example, if she gets $\{H, T, T, H, T\}$, here's what's happening:

<BayesSequenceWidget />

With every flip, she multiplies her odds by a likelihood ratio: $2/1$ for heads, $2/3$ for tails.

In this example, three tails out of five slightly favor the fair-coin hypothesis. After converting back to probabilities, her initial 66.7% belief in fairness increased to about 70%. Gonna need way more flips to know for sure!

Before we start pondering about what's gonna happen long-term, let's simplify our calculator a bit. We'll get more clarity if we take logarithms of everything. Instead of multiplying odds and likelihood, we will be adding so-called _log-odds_. 

Here's the same step-by-step calculator after taking logarithms. For example, "prior 1:0" in the calculator means that the prior is $2^1 : 2^0$. <Footnote>As a computer scientist, I always use $\log_2$, so I mostly drop the subscript and just write $\log$. </Footnote> 


<BayesSequenceLogWidget />

Notice that all the likelihoods (numbers in orange-ish rows) are now negative numbers. That makes sense - probabilities are smaller than one, so after taking the log, they become negative numbers. It's often useful to talk about absolute values of those numbers, which is why people define a quantity called _[surprisal](https://en.wikipedia.org/wiki/Information_content)_: Whenever you have something happening with probability $p$, the expression $\log 1/p$ can be called a surprisal and its units are bits (because we use binary logarithm). 

This is a logarithmic viewpoint on how surprised you are when something happens. Getting heads when you thought it was 1% likely? Super surprising ($\log 1/0.01 \approx 6.6 \textrm{bits}$). Getting heads on a fair coin? Meh ($\log 1/0.5 = 1 \textrm{bit}$).

Notice how in the widget, I replaced ":" with "vs". This is because in the logarithmic world, it's no longer the ratio that's important, it's the difference. For example, on heads, $\textsf{fair}$ hypothesis is surprised by $1$ bit, while the $\textsf{biased}$ hypothesis is surprised by $2$ bits. The difference of the two suprises - 1 bit - is the most important takeaway from the flip. This difference is the "_bits of evidence_" that the flipped heads provide. This difference is what we are essentially adding up in the posterior log odds, and it ultimately translates into the posterior probability. 

## 📊 Expected evidence <a id="expected-distinguishing-evidence"></a>

Remember, whenever our detective flip heads, she is getting $2 - 1 = 1$ bit of evidence that the coin is fair. Whenever she flips tails, she's getting $1 - 0.58 = 0.42$ bits of evidence that the coin is biased. 

This holds regardless of which one of the two hypothesis is true. Now, let's say the coin actually is biased. How fast will our Bayesian detective figure this out? 

This all comes down to adding bits of evidence. We can calculate the average number of bits that she learns per flip:

<div className="math-display-large">
<Math displayMode={true} math='\underbrace{0.25}_{P(\textsf{H} | \textsf{biased})} \cdot \underbrace{-1 \textrm{ bit}}_{\textrm{evidence when \textsf{H}}} + \underbrace{0.75}_{P(\textsf{T} | \textsf{biased})} \cdot \underbrace{0.58 \textrm{ bits}}_{\textrm{evidence when \textsf{T}}} \approx \underbrace{0.19 \textrm{ bits}}_{\substack{\textrm{expected evidence} \\ \textrm{per flip}}}' />
</div>

bits of evidence toward the truth. {/*This is the KL divergence between the true 25%/75% distribution and the model 50%/50% distribution!*/}

What does this mean in practice? After five flips, the detective gets $5 \cdot 0.19 \approx 1$ bit of evidence on average. So if she starts thinking 2:1 the coin is fair, after about five flips she'll be at 1:1. Another five flips gets her to 2:1 the coin is biased, the next five flips to 4:1, and so on.

The actual odds fluctuate around this average. But thanks to the law of large numbers, after $N$ flips the total evidence will be close to $0.19 \cdot N$. <Footnote> More precisely, it's $0.19N \pm O(\sqrt{N})$. Ultimately, we are taking logarithms and talk about bits because the law of large numbers works when we keep _adding_ numbers, not when we _multiply_ them. </Footnote>

Try it yourself below! I recommend checking edge cases like 50% vs 51% to get intuition about when the law of large numbers kicks in or what's the difference between 50% vs 1% and 1% vs 50%. 

<EvidenceAccumulationSimulator only_kl_mode={true} />

## 📝 KL divergence <a id="definition-of-kl-divergence"></a>


KL divergence is just the general formula for expected evidence accumulation. Say you've got two distributions $p$ and $q$, where $p$ is what's really happening, but you only know it's either $p$ or $q$. 

You can keep sampling from the unknown distribution and play the Bayesian game: Whenever you sample outcome $i$, compare the likelihoods $p_i$ and $q_i$ and update your beliefs. In classical Bayes' rule, you compare the so-called likelihood ratio $p_i / q_i$, but if there are more updates, it's easier to work with "the bits of evidence", or more technically the log-likelihood ratio $\log p_i / q_i$. 

On average, each sample from the true distribution $p$ gives you:<Footnote> About notation: Most people write $D_{KL}(p||q)$ instead of $D(p,q)$. The double bars are there to remind you that $D_{KL}(p||q) \not= D_{KL}(q||p)$. We'll keep it simple with $D(p,q)$ since we'll be using this a lot. 🙂 </Footnote>

$$
D(p,q) = \sum_{i = 1}^n p_i \cdot \log \frac{p_i}{q_i}
$$

bits of evidence toward the truth.

__When this number is small, the distribution $q$ is a pretty good probabilistic model of $p$__ - it takes many samples before our detective figures out that she's indeed sampling from $p$, and not from the imposter $q$. 
You can also think of $1/D(p,q)$ as "how many samples until I get one bit of evidence." (assuming $D(p,q) < 1$) One bit of evidence means that the odds for the true hypothesis doubled. <Footnote>This isn't the same as doubling the probability. Going from 1:1 to 2:1 odds changes the probability from 50% to 66.7%. But with lopsided odds like 1:1000, gaining a bit toward the underdog (making it 2:1000) almost doubles its probability. And gaining a bit the other way (1:2000) almost halves the underdog's probability. If you keep getting bits of evidence toward the truth, the truth's probability shoots up exponentially until it's comparable to the alternative, then the alternative's probability tanks exponentially. </Footnote>

Notice KL divergence is about the evidence, not your starting beliefs. It tells you how fast beliefs change, no matter whether the detective started with $1:2$ or $1000:1$. Sometimes, we like to divide statistics into Bayesian and frequentist; KL & its friends are useful for both. 



## 🚀 What's next?

In the [next section](../02-crossentropy), we'll dig deeper into the KL formula and see how it connects to entropy and cross-entropy.





=================================================================================
=================================================================================
CHAPTER: Crossentropy & Entropy
FILE: 02-crossentropy.mdx
=================================================================================
=================================================================================

# KL properties & (cross-)entropy

In this chapter, we'll see how KL divergence can be split into two pieces called _cross-entropy_ and _entropy_. 

<KeyTakeaway>
![Formula for KL divergence](02-crossentropy/crossentropy_entropy_formula.png)
Cross-entropy measures the average surprisal of model $q$ on data from $p$. When $p = q$, we call it entropy. 
</KeyTakeaway>




## 🧠 KL = cross-entropy - entropy

Quick refresher: In the [previous chapter](01-kl_intro), we saw how KL divergence comes from repeatedly using Bayes' theorem with log-space updating:

<BayesSequenceLogWidget highlightSurprisals={true} />

Each step adds surprisals ($\log 1/p$) to track evidence.
Last time, we focused on the differences between surprisals to see how much evidence we got for each hypothesis. Our Bayesian detective just keeps adding up these differences.

But the detective could also add up the total surprisal for each hypothesis (green and orange numbers in the above widget), and then compare overall _Total surprisal_  values. This corresponds to writing KL divergence like this:

<Math id="cross-entropy-decomp" displayMode={true} math='
\underbrace{\sum_{i = 1}^n p_i \log \frac{p_i}{q_i}}_{D(p,q)}
 \;\;\;=\;\;\;
\underbrace{\sum_{i = 1}^n p_i \log \frac{1}{q_i}}_{H(p,q)}
 \;\;\;-\;\;\;
\underbrace{\sum_{i = 1}^n p_i \log \frac{1}{p_i}}_{H(p)}
'/>

These two pieces on the right are super important: $H(p,q)$ is called cross-entropy and $H(p)$ is entropy. Let's build intuition for what they mean. 

##  ❌ Cross-entropy <a id = "cross"></a>
Think of cross-entropy as: __how surprised you are on average when seeing data from $p$ while modeling it as $q$?__ 

Explore this in the widget below. The widget shows what happens when our Bayesian detective from the previous chapter keeps flipping her coin. The red dashed line is showing cross-entropy - the expected surprisal of the model $q$ as we keep flipping the coin with bias $p$. The orange line shows the entropy—this is the expected surprisal when both the model and actual bias are $p$. 
KL divergence is the difference between cross-entropy and entropy. Notice that the cross-entropy line is always above the entropy line (equivalently, KL divergence is always positive). 



If you let the widget run, you will also see a blue and a green curve - the actual surprisal measured by our detective in the flipping simulation. We could also say that these curves measure cross-entropy—it's the cross-entropy between the _empirical distribution_ $\hat{p}$ (the actual outcomes of the flips) and the model $q$ (blue curve) or $p$ (green curve). The empirical cross-entropies are tracking the dashed lines due to the [law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers). 


<CrossEntropySimulator />



Bottom line: _Better models are less surprised by the data and have smaller cross-entropy. KL divergence measures how far our model is from the best one._

## 🎲 Entropy

The term $H(p) = H(p, p) = \sum_{i = 1}^n p_i \log 1 / p_i$ is a special case of cross-entropy called just plain _entropy_. It's the best possible cross-entropy you can get for distribution $p$—when you model it perfectly as itself.  

Intuitively, entropy tells you how much surprisal or uncertainty is baked into $p$. Even if you know you're flipping a fair coin and hence $p = q = \frac12$, you still don't know which way the coin will land. There's inherent uncertainty in that—the outcome still carries surprisal, even if you know the coin's bias. This is what entropy measures. 

The fair coin's entropy is <Math math = "H(\{\textsf{H: }1/2, \textsf{T: }1/2\}) = \frac12\cdot \log2 +  \frac12\cdot \log2 = 1" /> bit. 
But entropy can get way smaller than 1 bit. If you flip a biased coin where heads are very unlikely—say $p(\textsf{H} = 0.05)$—the entropy of the flip gets close to zero. Makes sense! Sure, if you happen to flip heads, that's super surprising ($\log 1/0.05 \approx 4.32$). However, most flips are boringly predictable tails, so the _average_ surprise gets less than 1 bit. You can check in the widget below that $H(\{\textsf{H}: 0.05, \textsf{T}: 0.95\}) \approx 0.29$ bits per flip. Entropy hits zero when one outcome has 100% probability. 

Entropy can also get way bigger than 1 bit. Rolling a die has entropy $\log_2(6) \approx 2.6$ bits. In general, a uniform distribution over $k$ options has entropy $\log_2 k$, which is the maximum entropy possible for $k$ options. Makes sense—you're most surprised on average when the distribution is, in a sense, most uncertain.  

<EntropyWidget numCategories={6} title="Entropy of die-rolling" />

<Expand headline = "Example: correct horse battery staple">
Here's an example. Let's say there are about <Math math="2^{11}" /> English words that can be described as 'common'. If you generate uniformly four such common words and make your password the concatenation of them, the total entropy of your password is thus going to be $44$ bits. That's because entropy is a special case of cross-entropy and is thus additive. 

Having a uniform distribution with 44 bits of entropy is just a different way of saying that we have a uniform distribution with $2^{44}$ possible outcomes. 
This comic wisely teaches us that this many possibilities make it a pretty secure password! Even if an adversary knows how we generated it, cracking it means they have to check about <Math math="2^{44}" /> passwords. 

<a href="https://xkcd.com/936/" target="_blank" rel="noopener noreferrer">
  <img src="02-crossentropy/password.png" alt="password" style={{cursor: 'pointer'}} />
</a>
</Expand>


## ⚖️ Relative entropy
KL divergence can be interpreted as the gap between cross-entropy and entropy. It tells us how far your average surprisal (cross-entropy) is from the best possible (entropy). 
That's why in some communities, people call KL divergence the _relative entropy_ between $p$ and $q$. <Footnote>Way better name than 'KL divergence' if you ask me. But 'KL divergence' is what most people use, so I guess we're stuck with it. </Footnote>



## 🚀 What's next? <a id="next-steps"></a>

We're getting the hang of KL divergence, cross-entropy, and entropy! Quick recap:

![Formula for KL divergence](02-crossentropy/crossentropy_entropy_formula.png)

In the [next chapter](03-entropy_properties), we will do a recap of what kind of properties these functions have and then we are ready to get to the cool stuff. 




=================================================================================
=================================================================================
CHAPTER: Entropy properties
FILE: 03-entropy_properties.mdx
=================================================================================
=================================================================================

import LnVsXGraph from "@/components/widgets/LnVsXGraph";

# Entropy properties

In this chapter, we'll go over the fundamental properties of KL-divergence, entropy, and cross-entropy. We have already encountered most of the properties before, but it's good to understand them in more depth. 

This chapter contains a few exercises. I encourage you to try them to check your understanding. 

<KeyTakeaway>
KL divergence $D(p,q)$ is always nonnegative. Equivalently, $H(p, q) \ge H(p)$.  
</KeyTakeaway>



## 💥 KL divergence can blow up


Recall, KL divergence is algebraically defined like this:

<Math id="kl-definition" displayMode={true} math="D(p,q) = \sum_{i = 1}^n p_i \log \frac{p_i}{q_i}" />

Here's the biggest difference between KL and some more standard, geometrical ways of measuring distance like $\ell_1$ norm ($\sum |p_i - q_i|$) or $\ell_2$ norm (<Math math = "\sqrt{\sum (p_i - q_i)^2}" />). Consider these two possibilities: 

1. $p_i = 0.5, q_i = 0.49$
2. $p_i = 0.01, q_i = 0.0$

Regular norms ($\ell_1, \ell_2$) treat these errors as roughly equivalent. But KL knows better: the first situation is basically fine, while the second is catastrophic! For example, the letters "God" are rarely followed by "zilla", but any model of language should understand that this _may_ sometimes happen. If $q(\textrm{'zilla'} \mid \textrm{'God'}) = 0.0$, the model will be infinitely surprised when 'Godzilla' appears! 


Try making KL divergence infinite in the widget below. Next level: Try to make it infinite while keeping $\ell_1$ and $\ell_2$ norm close to zero (say $< 0.1$). 

<DistributionComparisonWidget title="KL Divergence Explorer" />



## ⚖️ KL divergence is asymmetrical<a id = "asymmetry"></a>

The KL formula isn't symmetrical—in general, $D(p,q) \neq D(q,p)$. Some describe this as a disadvantage, especially when comparing KL to simple symmetric distance functions like $\ell_1$ or $\ell_2$. But I want to stress that the asymmetry is a feature, not a bug! KL measures how well a model $q$ fits the true distribution $p$. That's inherently asymmetrical, so we need an asymmetrical formula—and that's perfectly fine.

In fact, that's why people call it a [_divergence_](https://en.wikipedia.org/wiki/Bregman_divergence) instead of a distance. Divergences are kind of wonky distance measures that are not necessarily symmetric.



<Block headline = "Example">
Imagine the true probability $p$ is 50%/50% (fair coin), but our model $q$ says 100%/0%. KL divergence is ... 
<Math displayMode={true} math = "\frac12 \cdot \log \frac{1}{1} + \frac12 \cdot \log \frac{1}{0} = \infty"/>

... infinite. That's because there's a 50% chance we gain infinitely many bits of evidence toward $p$ (our posterior jumps to 100% fair, 0% biased).

Now flip it around: truth is 100%/0%, model is 50%/50%. Then 
<Math displayMode={true} math = "1 \cdot \log \frac{1}{1/2} + 0 \cdot \log \frac{1}{1/2} = 1"/>
Every flip gives us heads, so we gain one bit of evidence that the coin is biased. As we keep flipping, our belief in fairness drops exponentially fast, but it never hits zero. We've gotta account for the (exponentially unlikely) possibility that a fair coin just coincidentally came heads in all our past flips.
</Block>

Here's a question: The following widget contains two distributions—one peaky and one broad. Which KL is larger? <Footnote>KL divergence also works for continuous distributions; just replace sum by integral. More on that [later](04-mle#maximum-entropy-principle). </Footnote>

<KLAsymmetryVisualizerWidget />


## ✅ KL is nonnegative

If you plug in the same distribution into KL twice, you get:

<Math displayMode={true} math="D(p, p) = \sum_{i = 1}^n p_i \cdot \log \frac{p_i}{p_i} = 0" />

because $\log 1 = 0$.
Makes sense—you can't tell the truth apart from the truth. 🤷

This is the only occasion on which KL can be equal to zero. Otherwise, KL divergence is always positive. This fact is sometimes called [Gibbs inequality](https://en.wikipedia.org/wiki/Gibbs%27_inequality). I think we built up a pretty good intuition for this in [the first chapter](01-kl_intro). Imagine sampling from $p$ while Bayes' rule increasingly convinces you that you're sampling from some other distribution $q$. That would be really messed up! 

This is not a proof though, just an argument that the world with possibly negative KL is not worth living in. Check out the formal proof if you're curious.

<Expand headline="Proof of nonnegativity">
We want to prove that <Math math = "\sum_{i = 1}^n p_i \cdot \ln \frac{p_i}{q_i}  \ge 0" /> for any $p,q$. I've used the natural logarithm in the KL divergence definition to keep things short. 

Let's estimate the logarithmic expression $\ln \frac{p_i}{q_i}$ inside the sum. Our estimate should be tight whenever $p_i = q_i$ since we know the inequality is tight for $p = q$. The best linear approximation of logarithm tight at 1 <Tooltip tooltip={<LnVsXGraph width={140} height={90} />}>is this one: $\ln (1+x) \le x$</Tooltip>. We use it like this:

<Math displayMode={true} math="\begin{aligned}
-D(p,q)
&= \sum_{i = 1}^n p_i \cdot \ln \frac{q_i}{p_i}\\
&\le \sum_{i = 1}^n p_i \cdot  \left( \frac{q_i}{p_i} - 1 \right)\\
&= \sum_{i = 1}^n \left( q_i - p_i \right)\\
&= 1 - 1 = 0
\end{aligned}" />

</Expand>

Since KL can be written as the difference between cross-entropy and entropy, we can equivalently rewrite $D(p, q) \ge 0$ as
<Math displayMode = {true} math = "H(p, q) \ge H(p)." />
That is, the best model of $p$ that accumulates the surprisal at the least possible rate is ... 🥁 🥁 🥁 ... $p$ itself. 


### ➕ Additivity <a id = "additivity"></a>

Whenever we keep flipping coins, the total entropy/cross-entropy/relative entropy just keeps adding up. This property is called additivity and it's so natural that it's very simple to forget how important it is. We've used this property implicitly in earlier chapters, whenever we talked about repeating the flipping experiment and summing surprisals. 

More formally: Say you've got a distribution pair $p$ and $q$ - think $q$ is a model of $p$ - and another pair $p'$ and $q'$. Let's use $p \otimes p'$ for the product distribution -- [a joint distribution](https://en.wikipedia.org/wiki/Joint_probability_distribution) with marginals $p,p'$ where they are independent. In this setup, we have this: 

<Math displayMode={true} math="D(p \otimes p', q \otimes q') = D(p, q) + D(p', q')" />
<Math displayMode={true} math="H(p \otimes p', q \otimes q') = H(p, q) + H(p', q')" />
<Math displayMode={true} math="H(p \otimes p') = H(p) + H(p')" />

Entropy has an even stronger property called _subadditivity_: Imagine any distribution $r$ with marginals $p, q$. Then, 
<Math displayMode={true} math="H(r) \le H(p) + H(p')" />
For example, imagine you flip a coin and record the same outcome twice. Then, the entropy of each record is 1 bit and subadditivity says that the total entropy is at most $2$ bits. In this case, it's actually still just 1 bit. 

## 🎵 Anthem battle

I collected the national anthems of the USA, UK, and Australia, and put them into one file. The other text file contains anthems of a bunch of random-ish countries. For both text files, I compute the frequencies of 26 letters 'a' to 'z'. So there are two distributions $p_1$ (English-speaking) and $p_2$ (others). The question is: which one has larger entropy? And which of the two KL divergences $D(p_1, p_2), D(p_2, p_1)$ is larger? 

Make your guess before revealing the answer. 

<KLCalculatorWidget /> 








## 🚀 Next steps

We now understand pretty well what KL divergence and cross-entropy stand for. 

The mini-course has two more parts. We will:
- Pondering what happens if we try to make KL divergence small. This will explain a lot about ML loss functions, and includes some fun applications of probability to several of our riddles. Continue with the [next chapter (Maximum likelihood)](03-minimizing) in the menu. 
- Play with codes and see what they can tell us about neural nets. That's the [Coding theory chapter](08-coding_theory) in the menu. 

I suggest you jump to whatever sounds more interesting. See you there!




################################################################################
PART II: OPTIMIZATION
################################################################################

=================================================================================
=================================================================================
CHAPTER: Minimizing KL
FILE: 04-minimizing.mdx
=================================================================================
=================================================================================

[ERROR: File public/04-minimizing.mdx not found]



=================================================================================
=================================================================================
CHAPTER: Maximizing entropy
FILE: 05-max_entropy.mdx
=================================================================================
=================================================================================

# Minimum KL $\rightarrow$ Maximum entropy <a id="max-entropy-distributions"></a>

In the [previous chapter](04-mle), we saw what happens when we minimize $q$ in the KL divergence $D(p, q)$. We used this to find the best model of data $p$. 

In this chapter, we will ponder the second question - what happens if we minimize $p$ in $D(p, q)$? This way, we will build the so-called _maximum entropy principle_ that guides us whenever we want to choose a good model distribuiton. 

<KeyTakeaway>
Max-entropy principle constructs the most generic distributions satifying some constraints. Most useful distributions are max-entropy for some parameter. 
</KeyTakeaway>

## 💪 Conditioning on steroids <a id="finding-better-model"></a>

Suppose I want to determine a probability distribution modelling the random variable $X$ of how long it takes me to eat lunch. My initial (and very crude) model of $X$ might be a uniform distribution $q$ between <Math math="0" /> and <Math math="60" /> minutes.

Starting with this model, I can try to get some new information and condition on it to get a better model $p$. 

For example, let's say that after eating many lunches, I observe that I always finish after at most 30 minutes. I can turn this to a new information that $X \le 30$. I can condition on this information and get a better model:

![conditioning](05-max_entropy/condition.png)

Let's try again. I eat many more lunches, but this time I keep recording the average time it takes me to eat lunch. Say, it turns out to be 15 minutes. How do I change $q$ to reflect this new information? The probability theory gives a clear answer.

![syntax-error](05-max_entropy/syntax_error.png)

We simply can't do this. In probability theory, we can condition on events like $X \le 30$, i.e., facts that are true for some values that $X$ can attend, but not others. But now we would like to condition on $E[X] = 15$ which is not an event, just a fact that's true for some _distributions_ over $X$, but not others. 

The fun part is that we can use KL divergence to 'condition' on $E[X] = 15$. It turns out that the most reasonable way to account for the new information is to choose <Math math = "p_{\textrm{new}}" /> as the model minimizing KL divergence to $q$. That is, for the set $P$ of distributions $p$ with $E_p[X] = 15$, choose
<Math id="min-relative-entropy" displayMode={true} math = "p_{\textrm{new}} = \argmin_{p\in P} D(p, q)" />

In the example, <Math math = "p_{\textrm{new}}" /> happens to look like exponential distribution: 

![max-ent](05-max_entropy/max_ent_example.png)

This is sometimes called [the minimum relative entropy principle](resources#intermediate-resources). Why does this make sense? Intuitively, I want to find a distribution <Math math="p \in P" /> that would serve as the new best guess for what the truth is, while the old model distribution <Math math="q" /> remains as good a model of $p$ as possible. This is what we achieve by minimizing KL divergence $D(p, q)$.


Admittedly, this intuition may feel a bit shaky, as we typically prefer $p$ to represent the "true" distribution when using KL divergence, whereas here it's simply a new, improved, model. There's a more technical argument called [Wallis derivation](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy#The_Wallis_derivation) that explains why we can derive minimum relative entropy as "conditioning on steroids" from the first principles.

<Expand headline="Detailed discussion of Wallis derivaiton" advanced={true}>
The following argument is a version of the so-called [Wallis derivation](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy#The_Wallis_derivation). 
We will reformulate our setup slighlty to sidestep the "syntax-error" issue and to be able to condition on facts of the type "our model distribution should come from the set $P$". 

Imagine we start with some distribution $q$ and sample from it $n$ times. We'll use $\hat{q}$ to denote the empirical distribution of these samples. The Wallis trick is to realize that $\hat{q}$ is no longer a simple distribution, it's a distribution over distribution (also called a mixture distribution). For $\hat{q}$, it now makes sense to ask questions such as whether $\hat{q}$ belongs to some family of distributions $P$ (e.g., all distributions with an average of 15). 


Our plan is to imagine a very large $N$ and the process of generating $\hat{q}$ from $q$. We then condition the distribution of $\hat{q}$ on the fact that $\hat{q} \in P$ to obtain the posterior distribution. We will argue the following claim: _As $N$ approaches infinity, the posterior distribution will become concentrated on the distribution $p \in P$ that minimizes $D(p,q)$_. This provides the justification for the minimum relative entropy principle. The methodology is essentially equivalent to saying "If I keep my model $q$, but inexplicably, the data actually is from a set $P$, then I can as well model the data by <Math math = "\argmin_{p \in P} D(p,q) " />. 

Let's prove the claim.

First, a bit of notation: Think of $\hat{q}$ as a [random vector](https://en.wikipedia.org/wiki/Multivariate_random_variable) whose randomness stems from the choice of the $N$ samples from $q$. Let $P_0$ be the space of all random vectors <Footnote>More precisely, $P_0$ should be chosen as the space of all distributions where probabilities are multiples of $1/N$, but let's not get bogged down in technicalities.</Footnote> - we are given its subset $P$ from which the new model shall be picked. Here's a picture:

![Wallis derivation](04-mle/wallis.png)

We now need to understand the distribution of $\hat{q}$, i.e., we want to understand the probability $P(\hat{q} = p)$ for $p \in P_0$. There are two ways to do this.

1.  We can write it down exactly (<Math math="P(\hat{q} = p) = {N \choose p_1N, \dots, p_kN}\cdot \prod_{i = 1}^k q_i ^ {p_i N}" />) and solve it (using Stirling's approximation, we have <Math math="P(\hat{q} = p) \approx 2^{H(p)\cdot N}" /> and thus <Math math="P(\hat{q} = p) \approx 2^{-D(p,q)\cdot N}" />).

2.  If you prefer to see the underlying algebra, we can revisit the [first chapter](01-kl_intro#expected-distinguishing-evidence) where our Bayesian friend was essentially trying to compute the probability we now need. More concretely, if our friend obtained $N$ samples and the empirical distribution was $p$, all the evidence supporting a hypothesis $q$ summed up to the value $N \cdot H(p, q)$. The meaning of this evidence is that the probability <Math math="P(\hat{q} = p)" /> must be proportional to <Math math="2^{-N \cdot H(p, q)}" />; we just don't know the normalization constant.

Now, with a bit of hand-waving, we can observe that the probability distribution of <Math math="\hat{q}" /> will be concentrated around the value of $q$ as $N$ approaches infinity, even though there's a nonzero probability that $\hat{q} \in P$. If that happens, we similarly find that the posterior distribution is concentrated around the value <Math math="\tilde{p} = \argmin_{p \in P} D(p,q)"/>. We conclude that in the limit of $N$ going to infinity, working with mixture distributions and conditioning on it being from $P$ is equivalent to simply replacing $q$ with <Math math="\argmin_{p \in P} D(p,q)"/>.


As a final note (unrelated to Wallis derivation), to justify the inuition that minimum relative entropy principle extends conditioning, we have to check carefully that conditioning is really a special case of minimizing KL. The fact that you have to prove (and it's a good exercise!) is this: If you have a joint distribution $p$ over two random variables $X,Y$ and learn that $Y = y$, there are two things you could do. 1) Define distribution $p_1$ by conditioning $p$ on $Y = y$. 2) Define distribution $p_2$ as <Math math = "\argmin_{p'} D(p', p)" />. You should prove that $p_1 = p_2$. 

</Expand>


{/*
<Expand headline = "Min relative entropy implies Bayes' updating" advanced={true}>
One more technical point. We should confirm that we can view classical updating as a special case of the min relative entropy principle. This justifies the intuition that minimum relative principle is "conditioning on steroids". 


Consider the general problem of updating after seeing evidence: We have a joint distribution <Math math = "p_{old}" /> over two random variables $X$ (which we're interested in) and $Y$ (representing possible evidence we might observe).
Then, we observe some evidence $Y=y$. We want to compute the new distribution <Math math = "p_{new}" /> that incorporates this observation. The rules of conditional probability say that <Math math = "p_{new}" /> should be $0$ for $Y \not= y$ and, for $Y = y$, it should be the conditional distribution of $p$ given $Y = y$.

The observation we can now make is that <Math math="p_{new} = \argmin_{p \in P} D(p, p_{old})" />, where $P$ is the set of distributions where $P(Y = y') = 0$ for $y' \ne y$<Footnote>The proof of this observation requires some rewriting, but in essence, it hinges on the fact that the distribution closest in KL to $p$ conditioned on $Y = y$ is... the same distribution. Really, nothing complicated is happening here; we are just saying that the new distribution should resemble the old one, merely rescaled so that probabilities sum to one.</Footnote>.
</Expand>
*/}

### 🌪️ The maximum entropy principle <a id="maximum-entropy-principle"></a>

Let's delve deeper into the minimum relative entropy principle. A conceptual issue with it is that it only allows us to refine an existing model $q$ into a better model $p$. But how did we choose the initial model $q$ in the first place? It feels a bit like a chicken-and-egg dilemma.

Fortunately, there's usually a very natural choice for the simplest possible model $q$: the uniform distribution. This is the unique most 'even' distribution that assigns the same probability to every possible outcome. There's also a fancy name for using the uniform distribution as the safe-haven model in the absence of any relevant evidence: [the principle of indifference](https://en.wikipedia.org/wiki/Principle_of_indifference).

It would be highly interesting to understand what happens when we combine both principles together. That is, say that we start with the uniform distribution <Math math = "q_{\textrm{uniform}}" /> (say it's uniform over the set $\{1, \dots, k\}$). What happens if we find a better model <Math math = "p_{\textrm{new}} \in P" /> by minimizing KL divergence? Let's write it out:

<Math displayMode={true} math="p_{\textrm{new}} = \argmin_{p \in P} D(p,q_{\textrm{uniform}}) = \argmin_{p \in P}  \sum_{i = 1}^k p_i \log \frac{p_i}{ 1/k}" />

I am a one-trick pony, whenever I see KL divergence, I split it into cross-entropy and entropy:

<Math displayMode={true} math="D(p,q_\text{uniform}) = \underbrace{\sum_{i = 1}^k p_i\log \frac{1}{1/k}}_{\textrm{cross-entropy}} - \underbrace{\sum_{i = 1}^k p_i\log \frac{1}{p_i}}_{\textrm{entropy}}" />

In the previous chapter, it was the second term that was constant, now it's the first term: $\sum_{i = 1}^k p_i\log \frac{1}{1/k} = \log(k)$ does not depend on $p$, so minimizing KL divergence is equivalent to minimizing $-H(p)$. We get:

<Math displayMode={true} math="p_{\textrm{new}} = \argmin_{p \in P} D(p, q_{\textrm{uniform}}) = \argmax_{p\in P} H(p)" />

We've just derived what's known as the [maximum entropy principle](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy): given a set $P$ of distributions to choose from, we should opt for the $p\in P$ that maximizes the entropy $H(p)$.

<Expand advanced={true} headline = "Working with Continuous Distributions"><a id = "continuous"></a>

Sometimes we need to use entropy and KL divergence for continuous distributions. For KL divergence, not much changes. We just replace the sum with an integral and write:
<Math displayMode={true} math = "D(p, q) = \int_x p(x) \log \frac{p(x)}{q(x)} dx. " />

For entropy, it's a bit trickier. To understand what's happening, let's remember what an integral intuitively represents. For example, a continuous uniform distribution over the interval $[0,1]$ is, in some sense, a limit of discrete distributions, where the $n$-th distribution in the sequence is the uniform distribution over <Math math = "\{\frac{1}{n}, \dots, \frac{n}{n}\}"/>. 


![uniform](05-max_entropy/unif.png)

When we use integral formulas like the one above for KL divergence, it's justified by _convergence_: If we discretize the real line into buckets of length $1/k$ and compute KL divergence, then as $k$ increases, the discretized results will converge to the integral's value (unless $p,q$ are some truly wild functions).

The problem with entropy is that it doesn't converge. Indeed, the entropy of a uniform distribution with $k$ options is $\log k$. If $k$ goes to infinity, $\log k$ goes as well, hence the entropy of a continuous uniform distribution is infinite. This makes sense! If I sample a real number from [0,1], there is infinitely many bits of surprise in what I see. 

What does this mean for the principle of maximum entropy? If this principle was purely about entropy, we'd be in trouble. But, thankfully, we now understand that it is fundamentally about _minimizing KL divergence_ between $p$ and a model distribution, which, in the case of the max entropy principle, is the uniform distribution.

So, let's write down the formula for KL between $p$ and the uniform distribution. Since the uniform distribution does not exist for real numbers, let's use the interval $[-C, C]$ as the support; $C$ is some large number. We get: 
<Math displayMode={true} math = "D(p, q_{uniform}) = \int p(x) \log \frac{p(x)}{1/(2C)} dx = \log (2C) - \int p(x) \log \frac{1}{p(x)} dx." />
That is, in the continuous case, the minimum relative entropy principle boils down to maximizing the expression $\int p(x) \log \frac{1}{p(x)} dx$. This holds for any constant $C$, so we might as well use the principle also in the limit when $x$ ranges over all real numbers where the uniform distribution is not really well-defined.

So, after all this discussion, generalizing the minimum relative entropy principle to continuous distributions still boils down to replacing $\sum$ with $\int$ and maximizing $\int p(x) \log \frac{1}{p(x)} dx$. This integral expression is called [differential entropy](https://en.wikipedia.org/wiki/Differential_entropy) so it looks like it's basically the same thing as our entropy formula for discrete distributions. In the main text, I am also calling this expression implicitly "the entropy". 

But make no mistake: entropy is not differential entropy! The fact that we can use differential entropy in the max-entropy principle is a bit of a lucky coincidence. The key to not get confused is to understand that it is the _relative entropy_, i.e., KL divergence that generalizes to continuous distributions. Entropy is infinite. Thus, we can replace entropy with differential entropy in our maximum entropy principle _only because the underlying argument is ultimately about KL divergence to the uniform distribution_!    
</Expand>


## 📐 General form of maximum entropy distributions

Let's now dive a bit deeper into maximum entropy. We'll try to understand what maximum entropy distributions actually look like. For example, we will see soon how does the maximum entropy distribution with $E[X] = 15$ looks like. 

Here's what I want you to focus on, though. Let's not worry about concrete numbers like 15 too much. To get the most out of the max-entropy principle, we have to think about the questions a bit more abstractly, more like: _If I fix the value of $E[X]$, what shape will the max-entropy distribution have? 


For such a broad question, the answer turns out to be surprisingly straightforward! Before telling you the general answer, let's see a couple of examples. 

If we consider distributions with a fixed expectation $E[X] = \mu$ (and the domain is non-negative real numbers), the maximum entropy distribution is the *exponential distribution*. This distribution has the form <Math math = "p(x) \propto e^{-\lambda x}" />. Here, $\lambda$ is a parameter - fixing $E[X]$ to attain different values leads to different $\lambda$s. <Footnote>In this particular case, the precise shape of the distribution is <Math math = "p(x) = \frac{1}{\mu} e^{- x/\mu}" /> if you want $E_p[X] = \mu$. But let's not worry about that too much. The symbol $\propto$ means that the if you use the formula, the probabilities don't sum up to one / probability densities don't integrate to one. You would have to multiply all $p(x)$ by a certain normalization constant for this to happen. Notice that using $\propto$ is a lot like using odds instead of probabilities - we don't want to focus on the relatively uninteresting normalization factors to avoid clutter. </Footnote>

Another example: If we fix the values of both $E[X]$ and $E[X^2]$, the maximum entropy distribution is the *normal distribution*, where <Math math = "p(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-(x-\mu)^2/(2\sigma^2)}." /> To keep things clean, we can rewrite its shape as <Math math = "p(x) \propto e^{-\lambda_1 x - \lambda_2 x^2}" /> for some parameters $\lambda_1, \lambda_2$ that have to be worked out from what values we fix $E[X]$ and $E[X^2]$ to. 

Spot a pattern?

<Block headline= "General form of max entropy distributions">
Suppose we have a set of constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$. Then, among all distributions that satisfy these constraints, the distribution $p$ with maximum entropy (if it exists) has the following shape:
<Math id="max-entropy-form" displayMode = {true} math = "p(x) \propto e^{\lambda_1 f_1(X) + \dots + \lambda_m f_m(X)}"/>
for some constants $\lambda_1, \dots, \lambda_m$.
</Block>
Notice that this general recipe doesn't tell us the exact values of $\lambda_1, \dots, \lambda_m$. Those depend on the specific values of $\alpha_1, \dots, \alpha_m$, while the general shape remains the same regardless of the $\alpha$ values. But don't get too hung up on the $\alpha$s and $\lambda$s. The key takeaway is that __the maximum entropy distribution looks like an exponential, with the "stuff we care about" in the exponent.__

Try building your own maximum entropy distribution on the interval $[0,1]$ by playing with $\lambda$ values:

<DistributionConstraintBuilder />

### 🧐 Why? <a id = "intuition"></a>

Let's build some intuition for this. Remember from [the previous chapter](03-minimizing) that the max-entropy principle is essentially about finding a distribution that is as close to uniform as possible, in the sense of minimizing KL divergence.

So, in what way are max-entropy distributions "close" to being uniform? Let's use the exponential distribution $p(x) \propto e^{-x}$ as an example. Say I independently sample two numbers from it, $x_1$ and $x_2$. Here's a little riddle: Is it more probable that I sample $x_1 = 10, x_2 = 20$ or that I sample $x_1' = 15, x_2' = 15$?

The answer is that both options have the same probability density. That's because $p(x_1)\cdot p(x_2) = e^{-x_1 - x_2}$. In our riddle, $x_1 + x_2 = x_1' + x_2'$, so both possibilities have a density proportional to $e^{-30}$. 

You can test it in the following widget. 

This property isn't exclusive to the exponential distribution; it holds for all max-entropy distributions that fit the form given by our formula <EqRef id="max-entropy-form" />. If you dare, the widget above also visualizes that if you sample $x_1, x_2, x_3$ from a Gaussian and fix the values of $x_1 + x_2 + x_3$ and $x_1^2 + x_2^2 + x_3^2$, the curve this defines (a circle) has constant density. 

<MaxEntropyVisualization />

In general, consider a distribution of the shape <Math math = "p(x) \propto e^{\lambda_1 f_1(x) + \dots + \lambda_m f_m(x)}" />. Now, imagine independently sampling a few points $x_1, \dots, x_k$ from that distribution. If you then tell me the values of the averages $a_1 = \frac{1}{k} \sum_{i = 1}^k f_1(x_i), \dots, a_m = \frac{1}{k} \sum_{i = 1}^k f_m(x_i)$, and I condition on this information, the conditional distribution over $x_1, \dots, x_k$ is actually uniform! This is because the probability density of any such tuple under our distribution $p$ is the same, equal to 
<Math displayMode={true} math = "p(x_1, \dots, x_k) \propto e^{\lambda_1 f_1(x_1) \,+\, \ldots \,+\, \lambda_m f_m(x_1)} \cdot \dots \cdot e^{\lambda_1 f_1(x_k) + \dots + \lambda_m f_m(x_k)} = e^{k(\lambda_1 a_1 + \dots + \lambda_m a_m)}. " /> 

You can imagine this as a generalization of the widget above. There's a super complicated space of all possible outcomes I can get by sampling $n$ times from my distribution. The max-entropy property says that if I draw a "contour" through outcomes that share the same empirical averages of the functions $f_1, \dots, f_m$, the conditional distribution is uniform on this contour. 

So, what's the takeaway? When you sample from max-entropy distributions, the experience is actually quite similar to sampling from a uniform distribution - the distribution over outcomes is uniform once you condition on the value of relevant properties! <Footnote>If we think of the number $n$ of samples as being very large, it gets even better. Due to the law of large numbers, we then know that with high probability, the empirical averages $\frac{1}{n} \sum_{i = 1}^n f_j(x_i)$ are going to be close to $E[f_j(X)]$. So, sampling many samples from max-entropy distributions is like sampling from the uniform distribution over all the "typical" instances satisfying $\frac{1}{n} \sum_{i = 1}^n f_j(x_i) \approx E[f_j(X)]$. </Footnote>


<Expand headline = "Proper derivation by Lagrange Multipliers" advanced = {true}>
There's an elegant derivation of the shape of max-entropy distributions using Lagrange multipliers. Feel free to skip this if you're not familiar with how they work. We'll only consider discrete distributions, say those with support $\{1, \dots, K\}$. 

We are solving the following optimization problem for $K$ variables $p_1, \dots, p_K$:

<Math displayMode={true} math = "\begin{aligned}
\text{VARIABLES:} &\quad p_1, \dots, p_K \\
\text{MAXIMIZE:} &\quad \sum_{i = 1}^K p_i \log \frac{1}{p_i}\\
\text{CONSTRAINTS:} & \quad \sum_{i = 1}^K p_i \cdot f_1(i) = \alpha_1\\
&\quad \vdots \\
&\quad \sum_{i = 1}^K p_i \cdot f_m(i) = \alpha_m\\
&\quad \sum_{i = 1}^K p_i = 1
\end{aligned}"/>

If there were no constraints, the problem would be simple! We'd just take the expression to maximize (the entropy) and set all partial derivatives with respect to $p_1, \dots, p_K$ to zero.

Fortunately, a technique called [Lagrange multipliers](https://en.wikipedia.org/wiki/Lagrange_multiplier) helps us here. It involves turning _hard_ constraints (like those in our problem) into _soft_ constraints. A soft-constraint version of our problem would be:

<Math displayMode={true} math = "\begin{aligned}
\text{VARIABLES:} &\quad p_1, \dots, p_K\\
\text{MAXIMIZE:} &\quad \sum_{i = 1}^K p_i \log \frac{1}{p_i}\\
&\quad - \lambda_1 \left(\sum_{i = 1}^K p_i \cdot f_1(i) - \alpha_1\right)\\
&\quad - \lambda_2 \left(\sum_{i = 1}^K p_i \cdot f_2(i) - \alpha_2\right)\\
&\quad - \dots \\
&\quad - \lambda_m \left(\sum_{i = 1}^K p_i \cdot f_m(i) - \alpha_m\right)\\
&\quad - \lambda_{m+1} \left(\sum_{i = 1}^K p_i - 1\right)
\end{aligned}"/>

What happens is that instead of requiring the solution to *exactly* satisfy all the constraints, we just say that we have to pay an additional cost for deviating from the target. The constants $\lambda_1, \dots, \lambda_{m+1}$ essentially tell us how important each constraint is—a large $\lambda_j > 0$ means that $\sum_{i = 1}^K p_i \cdot f_j(i) - \alpha_j$ had better be small! <Footnote>In fact, in this soft constraint formulation, we even get "paid" if <Math math = "\lambda_j \left( \sum_{i = 1}^K p_i \cdot f_j(i) - \alpha_j \right) < 0" />! </Footnote>

Long story short, Lagrange's method tells us that if someone provides a solution to our problem satisfying all $m+1$ _hard_ constraints, then we can find $m+1$ numbers $\lambda_1, \dots, \lambda_{m+1}$ such that this solution also solves the soft-constrained version. That's neat! We can now implement our plan of solving this by differentiation.

More precisely, let's use $\mathcal{L}$ for the soft-constrained objective:
$$
\mathcal{L}(p_1, \dots, p_K) = \sum_{i = 1}^K p_i \log \frac{1}{p_i}
- \lambda_1 \left(\sum_{i = 1}^K p_i \cdot f_1(i) - \alpha_1\right)
- \dots -
- \lambda_m \left(\sum_{i = 1}^K p_i \cdot f_m(i) - \alpha_m\right)
- \lambda_{m+1} \left(\sum_{i = 1}^K p_i - 1\right)
$$

We compute the derivative with respect to some $p_i$. Using the fact that $(p \log 1/p)' = -(p\log p)' = -\log p - 1$, we find that:

<Math displayMode={true} math = "\frac{\partial \mathcal L}{\partial p_i} = -\log p_i - 1 - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i) - \lambda_{m+1}"/>

That's fantastic! If we now set <Math math = "\frac{\partial \mathcal L}{\partial p_i} = 0"/>, we get a formula for $p_i$:
<Math displayMode={true} math = "p_i = e^{ -1 - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i) - \lambda_{m+1}}"/>
I find it more helpful to rewrite this as:
<Math displayMode={true} math = "p_i \propto e^{ - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i)}"/>

I've just swept some proportionality constants under the rug: if we remember that probabilities have to sum up to 1, we've arrived at a shockingly simple formula!

We could, of course, generalize this formula to other discrete sets beyond $\{1, \dots, K\}$, yielding:

<Math displayMode={true} math = "p(x) \propto e^{ - \lambda_1 f_1(x) - \dots - \lambda_m f_m(x)}"/>

This is the general form of max-entropy distributions (except we formulated it with $+\lambda_j$ instead of $-\lambda_j$). 

The same formula also holds when the probability distribution is continuous, except that $p(x)$ is then technically a probability density. Also, the correct buzzword is no longer Lagrange multipliers, but its generalization called [calculus of variations](https://en.wikipedia.org/wiki/Calculus_of_variations). <Footnote>You also have to spend a few more years trying to understand the conditions under which it can be used. Even the Lagrange multiplier case is more tricky—for example, we've only found local extrema and saddle points, not necessarily the maximizer. In our case, we are fortunate that we minimize convex function over convex domain, where the local minimum is also the global minimum. </Footnote>

Now, this formula isn't the complete solution to our problem because it involves some magical constants $\lambda_1, \dots, \lambda_m$ that we don't know. To find their values, we have to go back to our constraints—remember those $m$ numbers $\alpha_1, \dots, \alpha_m$? We can use the conditions $E[f_j(x)] = \alpha_j$ to work out the precise shape of the distribution.
</Expand>


## 📚 Catalogue of examples

Let's go through the list of maximum-entropy distributions you might have encountered. In fact, most distributions used in practice are maximum entropy distributions for some specific choice of functions $f_1, \dots f_m$.

So, when you come across a distribution, the right question isn't really "Is this a max entropy distribution?" It's more like, "**For what parameters is this a max entropy distribution?**" For example, you can forget the exact formula for the Gaussian distribution—it's enough to remember that using it implies you believe the mean and variance are the most important parameters to consider.

Let's go through the examples with this in mind. Please, do skip whatever doesn't ring a bell, the list is long. 

Let's start with what happens if we don't have any constraints. 

<Expand headline = "No Constraints">
In the absence of any constraints, we have $p(x) \propto e^{0}$, which means the max entropy distribution is *uniform*. In other words, the maximum entropy principle is truly an extension of [the principle of indifference](03-minimizing#maximum-entropy-principle) that we discussed in the previous chapter.

One painful fact to keep in mind is that the uniform distribution doesn't always exist. Concretely, there's no uniform distribution over all real numbers.
</Expand>

### 📈 Logits, softmax, exponentials

If we believe the mean is an important parameter of a distribution (which is very typical), the max entropy principle states that the right family of distributions to work with are those with the shape:

<Math displayMode={true} id = "exponential" math = "p(x) \propto e^{\lambda x}"/>

This kind of distribution is known by many names, depending on its domain. Let's go through some instances!

<Expand headline = "Logits & Logistic function">

Let's first understand the simplest possible case of <EqRef id = "exponential"/>: when our distribution is supported on only two outcomes, $a_1, a_2$. Then, the max-entropy distribution takes the form:

<Math displayMode={true} math = "p(a_1) = \frac{e^{ \lambda a_1}}{e^{ \lambda a_1} + e^{ \lambda a_2}},\;\;\; p(a_2) = \frac{e^{\lambda a_2}}{e^{\lambda a_1} + e^{ \lambda a_2}}"/>

But it's actually better to write it like this:

<Math displayMode={true} math = "p(a_1) = \frac{1}{1 + e^{- \lambda (a_1 - a_2)}},\;\;\; p(a_2) = 1 - p(a_1)"/>

The function $\sigma(x) = 1/(1 + e^{-x})$ is called the [logistic function](https://en.wikipedia.org/wiki/Logistic_function)<Footnote>Or sometimes a sigmoid function. Apparently, [sigmoid function](https://en.wikipedia.org/wiki/Sigmoid_function) is a bit more general term.</Footnote> and the parameter $x$ is typically called a [logit](https://en.wikipedia.org/wiki/Logit). Using this function, our max-entropy distribution can be written as:

<Math displayMode={true} math = "p(a_1) = \sigma(\lambda (a_1 - a_2)),\;\;\; p(a_2) = 1 - \sigma(\lambda (a_1 - a_2))"/>

Here's my interpretation: if you want to talk about probabilities, but for some reason you prefer to work with general real numbers instead of numbers in $[0,1]$, you should use logits and apply the logistic transformation to convert them to probabilities. 

The parameter $\lambda$ in the formula corresponds to the choice of units in which we measure those logits. For instance, I often prefer to use the binary logarithm, which means measuring logits in bits.

<LogisticWidget 
  title="Sigmoid Function" 
  initialLambda={2}
  minLambda={-5}
  maxLambda={5}
/>

<Expand headline = "Example: Elo System">
The Elo system is used to assign ratings to players. Its fundamental idea is that when you have two players with Elos $a_1$ and $a_2$, you can estimate the probability that the first one wins from their difference $a_1 - a_2$. As we just discussed, the logistic function is the right way to convert the difference $a_1 - a_2$ to probability. 

Indeed, this is how Elo was designed: The interpretation of a chess Elo number is that the probability that the first player wins should be <Math math = "\frac{1}{1 + 10^{d / 400}}" />. <Footnote>It's more precisely the expected score of the first player due to the existence of draws.</Footnote> This is the logistic function with $\lambda = \frac{1}{400} \cdot \ln 10$.

Notice that without knowing the value of $\lambda$, the statement "the Elo difference between these two players is 200" is meaningless—we don't know how Elo is scaled. Yet, even without knowing $\lambda$, we understand the system pretty well: if the chance of an upset (i.e., the lower-rated player wins) is $p$ for $d = 200$, then for $d=400$ it's roughly $p^2$, for $d=600$ it's roughly $p^3$, and so on.
</Expand>

</Expand>

<Expand headline = "Softmax"> <a id = "softmax"></a>

Let's stick with the max-entropy distribution for $E[X]$, i.e., the formula <EqRef id = "exponential"/>. However, now consider the more general case where our distribution is supported on a set of numbers $\{a_1, \dots, a_k\}$—these distributions are often called [categorical distributions](https://en.wikipedia.org/wiki/Categorical_distribution). In this scenario, the max entropy distribution is what's known as a *softmax* (or _softmin_) distribution—each number $a_i$ is chosen with probability:

<Math displayMode={true} math = "p_i \propto e^{\lambda a_i}. "/>

You can think of the softmax function (or softmin if $\lambda < 0$) as the generalization of the logistic function we just discussed—it's **the right way** to convert a bunch of numbers into probabilities. The numbers $a_i$ are still referred to as logits.

The parameter $1/|\lambda|$ is frequently called "temperature" because it behaves that way: at low temperatures, softmax is very orderly and acts much like the `max` function, whereas for high temperatures, the distribution becomes more chaotic, ultimately approaching the uniform distribution. <Footnote>The analogy with physics goes further. [Boltzmann distribution](https://en.wikipedia.org/wiki/Boltzmann_distribution) is essentially the softmax for energy, $1/\lambda$ in that distribution is the literal temperature. </Footnote> The chaos can be measured by entropy - you can see in the widget below how it decreases if you increase $|\lambda|$. 


<SoftmaxWidget values={[1, 3, 2, 5, 4]} title="Softmax Distribution Example" />


<Expand headline = "Example: Logits in Neural Networks">
Typical neural networks output probabilities. For example, a common neural network classifying images will output an entire probability distribution indicating whether a given picture is a dog/cat/horse/... instead of just a single prediction.
The issue with this is that often, most of these probabilities are extremely small, perhaps on the order of $10^{-10}$. That's because, given a picture of a dog, the neural network is usually quite certain it's not an octopus.

This makes it awkward to work directly with probabilities inside the network—it leads to all sorts of numerical and stability issues while running it (float precision) and even more while training it (vanishing gradients). So, neural networks instead try to predict logits, and the conversion to probabilities is simply the final layer of the network.

A nice bonus is that if you train the network using softmax with $\lambda = 1$, you can change the $\lambda$ parameter *after* training. For instance, setting $\lambda$ to infinity (temperature goes to zero) is equivalent to simply choosing the most probable option—this makes the model's output deterministic, which may be useful during deployment.

{/*There are also application for higher temperatures. For example, if you want to use LLM to solve a hard math problem, you might want to run it a million times to increase the probability the net solving it. But then you should probably run it at higher temperatures to make sure you want get the same thought process a million times in a row.

Notice how softmax allowed us to elegantly solve a problem that's so fuzzy that it's otherwise pretty hard to approach -- given a probability distribution $p$, how do we find distributions $p'$ that preserve as much as possible from $p$, yet they are more or less concentrated on the most probable values. */}
</Expand>

{/*
<Expand headline = "Modeling Pasta Consumption">

![Types of pasta -- from https://suttachaibar.com/15-types-of-pasta-shapes-to-know-and-love/](04-max_entropy/pasta.webp)

Theoretical economics tries to understand setups like this: Imagine there are $k$ substitutable products competing in the market—perhaps different shapes of pasta. We can observe how well each shape sells, but to draw conclusions from this data, we need some underlying model of what's happening. The basic model of rational consumers assumes each product $i$ has a certain utility $a_i$, and each customer simply buys the product with the highest utility. The problem with this model is that it predicts people should consistently buy only a single product—the one with the largest $a_i$.

How should we adapt this model to allow for non-trivial probability distributions? Well, we've seen that the natural "soft" generalization of taking a maximum is the softmax function, and this is indeed the function economists use to model such situations. There are more possible justifications for using this more complicated model—each customer might have a slightly different utility function, dislike repetition in their diet, etc. The parameter $\lambda$ in this model (the inverse temperature) then measures the strength of all these factors.

However, it's worth noting that one popular interpretation of softmax in behavioral economics is more sophisticated than "softmax seems natural, so let's go with it, whatever." The approach of the **theory of rational inattention** suggests that even if all agents are perfectly rational and have the same utilities, they still need to spend a non-trivial amount of time comparing different options and estimating their utility (at this point, stop thinking about pasta and instead consider buying a flat or a car). If you think about customers as solving an optimization problem that accounts for this, you end up with a type of optimization problem similar to [our derivation of max-entropy distributions](#intuition); under reasonable<Footnote>I.e., I forgot them.</Footnote> circumstances, you can derive the softmax distribution as the distribution of observed purchases.

</Expand>
*/}
</Expand>

<Expand headline = "Exponential/Geometric Distribution">
 <a id = "exponential"></a>

If the domain of the probability distribution from <EqRef id = "exponential"/> is non-negative integers or nonnegative reals, we get the so-called [geometric](https://en.wikipedia.org/wiki/Geometric_distribution) / [exponential](https://en.wikipedia.org/wiki/Exponential_distribution) distribution—another very basic and useful distribution. You should think of this as **the most natural** distribution on the domain of positive numbers (whether integers or reals).

Example: At the beginning of this chapter, we discussed how to model the distribution for how long I take my lunch. 
We started with the uniform distribution and then "conditioned" on the value of $E[X]$. This is exactly the same as using the max-entropy principle, thus the distribution we get this way is the exponential distribution.

{/*
<Footnote>
In practice, my guess would probably not have tail $p(x) \propto e^{-x}$, but a heavier tail, like <Math displayMode={false} math = "p(x) \propto e^{-\sqrt{x}}"/> or even $p(x) \propto 1/x^{C}$. Why? Well, notice how I am not sure about what the actual mean is. So, I should perhaps use a 2-layered model: 1) I sample your average lunch time $\mu$ from some distribution 2) I use exponential distribution with mean $\mu$.

How should I sample $\mu$ in the first step? Applying max-entropy principle again, perhaps I should sample it from exponential distribution, with mean being how long it takes me / average person to eat their lunch. If you crunch the numbers, the overall distribution that I will use as my input is going to have tails <Math displayMode={false} math = "p(x) \propto e^{-C\sqrt{x}}"/>. That is, the model is getting less sure that I won't see some really large numbers. Using power-law distribution in step 1) would lead to $p(x) \propto 1/x^{C}$.

This discussion is mostly meant to show what I love on the max entropy principle -- it enables us to rapidly operationalize and concretize our thought processes. Modelling real life is hard, but now we have a powerful tool that automatically builds concrete probabilistic models from vague thoughts like "there's two types of randomness, first in the average lunch time, and second in the variation around that average".
</Footnote>*/}

There's still an elephant in the room — the exponential distribution can't be normalized if the domain are _unbounded_ real numbers (i.e., both positive and negative). For that, we will need to use the Gaussian distribution. 
</Expand>


### 🔔 Gaussians

If we fix both mean and variance, the max-entropy distribution is Gaussian. 

<Expand headline="Gaussian Distribution">
<a id="normal"></a>

If we believe that both the mean and the variance are interesting, the max entropy principle suggests that we should choose the function that has a quadratic function of $x$ in the exponent. This means it has the shape:
<Math displayMode={true} id = "gaussian" math = "p(x) \propto e^{-\lambda_1 x^2 - \lambda_2 x}"/>

{/*This gets more familiar if we rewrite the equation like this:
<Math displayMode={true} math = "p(x) = A e^{-B(x-C)^2}"/>
where $A,B,C$ are some constants chosen so that $p(x)$ integrates to $1$.*/}
This is the family of [normal (or Gaussian) distributions](https://en.wikipedia.org/wiki/Normal_distribution), and the density formula is usually written more precisely as <Math math = "p(x) = \frac{1}{2\pi\sigma^2} e^{-(x-\mu)^2/\sigma^2}" /> <Footnote>Notice that for a bounded domain, the probability function from <EqRef id = "gaussian" /> could also look like $p(x) \propto e^{x^2}$. That is, the distribution with the smallest probabilities in the middle and large probabilities at the edges is also a perfectly fine max-entropy distribution. However, a distribution with this shape is not normalizable to 1 if the domain is all real numbers. There, the only possible solution is the familiar bell-shaped curve. </Footnote>

I think this provides a good (partial) explanation for "why is there $x^2$ in Gaussian?" It simply means that the Gaussian is the **right** distribution to work with if you care about the mean and the variance. If you cared about the first four [moments](https://en.wikipedia.org/wiki/Moment_(mathematics)), the appropriate family of distributions would be those with four-degree polynomials in the exponent.

Often, I like to think about the Gaussian as the simplest possible distribution on real numbers. Neither the uniform distribution nor the exponential distribution can be normalized over the entire real line, so we salvage this by fixing the first two moments.

</Expand>


We can now revisit our [financial mathematics riddle](00-riddles#financial-mathematics) from the intro. 

<RiddleExplanation id="financial-mathematics">

In that riddle, we look at daily changes in S&P index (normalized as a so-called log-return $\log S_{i+1}/S_{i}$ for all consecutive daily values $S_i, S_{i+1}$) and plot them in a histogram in the following widget

<FinancialDistributionWidget showBTC={true} showSAP={true} />

You can observe that the Laplace distribution seems to fit the data better than the normal distribution, as measured by KL between the data and the model distribution, though it's pretty close at the beginning. 

### Laplace distribution

The Laplace distribution has the shape <Math math = "p(x) \propto e^{-\lambda |x-\mu|}" />. What's the meaning of this formula? We could think of it as the max-entropy distribution for $E[|X-\mu|]$, but there's a more illuminating way to understand it. The Laplace distribution with parameter $\lambda$ can be viewed as the result of the following process:

1.  Sample a variance $\sigma^2$ from the exponential distribution. 
2.  Output a sample from $N(\mu, \sigma^2)$.<Footnote>More precisely, if we want Laplace distribution <Math math = "p(x) \propto e^{-\lambda |x-\mu|}" />, we should sample $\sigma^2$ from exponential distribution <Math math = "p'(t) \propto e^{-(\lambda^2/2) \cdot t}"/>. Let me know if you know a simple proof of [this fact](https://math.stackexchange.com/questions/1175076/how-to-prove-laplace-distribution-is-scale-mixture-of-gaussians)!</Footnote>


### 📖 S&P stories

To understand how this helps explain our financial data, consider the following two stories for price fluctuations:

* For the S&P index, which represents an average of many large companies, there's some variance in the daily returns mostly because many (somewhat independent) trades happen that day, each making the value of the index slightly higher or lower. This is the setup for the central limit theorem, which predicts that the data will look approximately Gaussian.

* But now think about the index over a longer time period. Then the simplified model above might be too basic. There are definitely periods where not much happens, but also periods with large volatility. <Footnote> For example: US elections, financial crisis, pandemic hits, war starts, etc.</Footnote>

Perhaps we should try a more advanced two-layered model to predict the shape of our data: Maybe each month, we sample $\sigma^2$—the volatility for that month. Let's sample it from the max-entropy distribution for the expected volatility, i.e., exponential. Next, for the rest of the month, we sample from a Gaussian with that variance. As we just discussed, this two-layered process samples precisely from the Laplace distribution.

Put differently, while a Gaussian fit implicitly says "I'm pretty sure about each day's volatility and unsure about the fluctuation around the mean," Laplace is saying, "I'm uncertain both about the volatility and the actual fluctuation of the day." This explains why Gaussian fits near-term data reasonably well (volatility of the time period stays roughly the same), while more long-term data starts looking more and more like Laplace. 

## 🤔 Is Laplace a good model?

Not really. We now understand that by fitting Laplace, we are claiming that daily variance fluctuates according to exponential distribution. Let's see how daily variance of S&P looks like:

<VolatilityDistributionWidget />

Exponential is a good fit most of the time, but struggles to predict extreme events. As far as I know, people used distributions such as log-normal, or inverse-gamma to fit this kind of data.<Footnote> I am not sure if this is still relevant - nowadays they may just train a network. </Footnote> These distributions are more complicated and using max-entropy principle, we could map them to more complicated stories about how the data behaves. Most importantly, they are basically power-law fits (see below) that are less surprised by stock crashes / world wars / etc. 

{/*<Footnote>As far as I know, one standard way of modeling financial data is the Student-t distribution. I won't bore you with its formula, but I'll tell you it's the distribution you get from a similar process to how we arrived at Laplace; but instead of sampling $\sigma^2$ from the exponential distribution, you sample it from the so-called inverse gamma distribution. The Gamma distribution is itself a max-entropy distribution for fixing $E[X]$ and $E[\log X]$ (and inverse gamma distribution means we measure volatility by $1/\sigma^2$ instead of $\sigma^2$).
That is, the Student-t distribution takes our model a bit further and adds uncertainty about the _scale_ of the volatility. For example, maybe if you look far enough into the past, you start seeing some extreme events like world wars/the Great Depression/industrial revolution, so perhaps we should be open to power-law fits instead of exponential ones.</Footnote>*/}

The point of this riddle is not really to come up with the best model for the data, though. The point is to showcase how maximum entropy gives us a great language to talk about data fitting. It enables us to explore, build more and more complicated models of data, and still keep track of what our models stand for, where their weaknesses are, and how to improve them.  
</RiddleExplanation>


### ⚖️ Power-law

If you care about the _scale_ of a random variable, maximum entropy leads to so-called power-law distributions. 

<Expand headline ="Power Law Distributions">
Sometimes we care about random variables that span a large range of values. For example, the median US city has a population of about 2,400, but there are many cities with more than a million inhabitants (see the picture).

![US cities](05-max_entropy/cities.png)

These situations are typically modeled by *power-law distributions*, where $p(x) \propto 1/x^C$ for some constant $C$. In the picture above, such a distribution would correspond to a straight line, so it would fit city populations quite well. From the perspective of maximum entropy, these distributions are simply max-entropy distributions when we fix $E[\log X]$. I.e., a power-law distribution is an exponential distribution into which we plug $\log X$ instead of $X$.

Whenever you use a power-law distribution, you're implicitly saying, "__The important thing to look at is not $X$, but $\log X$.__" In the case of cities, for example, it feels more sensible to classify them on a log-scale ($10^4$ – small, $10^5$ – medium, $10^6$ – large, $10^7$ – huge) instead of a normal scale ($10^5$ – small, $2 \cdot 10^5$ – medium, $3 \cdot 10^5$ – large, $4 \cdot 10^5$ – huge). 
</Expand>

And here's an application to our [XKCD riddle](00-riddles#xkcd):

<RiddleExplanation id="xkcd">

After four chapters developing the theory of KL divergence, we're finally ready to [dissect](https://www.goodreads.com/quotes/440683-explaining-a-joke-is-like-dissecting-a-frog-you-understand) the XKCD joke from [the list of riddles](00-riddles#xkcd).

[![Are the odds in our favor?](00-introduction/countdown.png)](https://xkcd.com/1159/)

It's all about how to choose a prior for the number on the wall. The first natural choice is simply the uniform distribution; that is, before looking at the wall, we model the number as a uniform random number with 14 decimal digits. A nice property of the uniform distribution is that each even after observing the right 8 digits,<Footnote>We actually also see a small piece of the leftmost digit in the comic, but let's forget this for simplicity.</Footnote> the distribution of the first 6 digits remain uniformly random. So, for that prior, the probability of all 6 hidden digits being zero is $1/10^6$—we are probably fine.

Uniform prior over $[0, 10^{14}]$ kind of sucks, though. If you look at various catastrophes, the average rate of how often they occur is all over the place -- $\sim 10^{15}$ seconds for $10\textrm{km}$-sized asteroids hitting Earth, $\sim 10^{10}$ for 9+ Richter-scale supervolcano eruption, and up to $\sim 10^{8}$ for AI doom. <Footnote>See [Precipice](https://books.ms/main/0F4823107289367C7A16C0AB1CF0F71D) by Toby Ord for estimations of these numbers. </Footnote> The uniform prior over $[0, L]$ however predicts that most catastrophes should happen at the roughly same rate of once per $L$ seconds!

Given all this, I'd argue for choosing the power-law distribution $p(x) \propto 1/x^\lambda$. In fact, I think that $p(x) \propto 1/x$ makes the most sense - that distribution corresponds to a uniform distribution over the _scales_. <Footnote>By this, I mean that this distribution satisfies <Math math = "\int_{10^1}^{10^2} \frac{1}{x} dx = \int_{10^2}^{10^3} \frac{1}{x} dx = \int_{10^3}^{10^4} \frac{1}{x} dx = \dots " />. You may know this kind of distriution from [the Benford's law](https://en.wikipedia.org/wiki/Benford%27s_law). </Footnote> This is also called the [log-uniform distribution](https://en.wikipedia.org/wiki/Reciprocal_distribution). The problem with $p(x) \propto 1/x$ is that we can't normalize this distribution if the domain is all real numbers, similarly to why we can't normalize the uniform distribution there. In our case, we can restrict the domain to integers between $0$ and $10^{14}$, so it's fine.

In the widget below, you can check out that the posterior probabbility that all hidden digits are zero becomes about $99.99\%$ under the new prior! Here's how to think about this: For a four-digit number, the probability it ends with $2382$ (and zeros are just padding) is about $1/10^5$. But for an eight-digit number, the probability it ends with $00002382$ is about $1/10^9$. So, if the number $X$ under the image is a "random four-digit" number, the evidence is much less suprising than if $X$ is a "random 9-digit number". 

In the widget below, the prior power-law distribution is binned into 14 bins between powers of 10. The Likelihood bar shows for each bin the probability that if a number sampled from the prior happens to be from that bin, it satisfies the revealed evidence about its digits. This is what goes into Bayes' rule that essentially multiplies the numbers in the first two tabs and normalizes them to get the posterior in the final tab. 

<XKCDCountdownWidget />

{/*
<Expand advance = {true} headline = "More plots for log-uniform prior">
The plot below shows the whole posterior distribution if we start with the log-uniform prior (on the left) and condition on the last digits of $x$ being "00002382". We grouped $x$-values into bins between $10^1, 10^{1.5}, 10^2, \dots$

![xkcd posterior](04-max_entropy/xkcd.png)

As in the widget, almost all the probability is now concentrated on a single outcome—$x_0 = 2382$. That makes sense: in the prior, it had probability $p(x_0) \propto 1/x_0 \approx 5 \cdot 10^{-4}$, while the next most likely outcome—$x_1 = 100002382$ had probability $p(x_1) \propto 1/x_1 \approx 10^{-8}$. That is, the probability of $x_1$ was $10^{-4}$ times smaller in the prior.

But also notice is that the posterior distribution still looks uniform for numbers $>10^9$. This also makes sense—for large numbers, their last few digits are like a coin flip, so learning them doesn't significantly change things, and thus the posterior remains uniform there.
</Expand>
*/}

The point is that the max-entropy principle gives us a language to talk about different priors and what they stand for. If the very natural log-uniform prior says we are screwed with probability $> 0.999$, it's time to look behind the picture. 
</RiddleExplanation>



### 🔢 Other Examples

A few more advanced examples, you probably want to skip them.  

<Expand advanced = {true} headline ="Assuming Independence">
An important property of entropy that [we mentioned earlier](03-entropy_properties#additivity) is its _subadditivity_: If you have a joint distribution $r$ with marginals $p,q$, then $H(r) \le H(p) + H(q)$. 

The implication for the max-entropy principle is this: Imagine you're working with a joint distribution and you know its two marginals $p,q$. Then, the maximum entropy principle tells us that the max-entropy joint distribution with these two marginals is the independent, product distribution.

Whenever people model things using probability distributions, they often assume that certain distributions / random variables are independent if they don't know what the dependence between them should look like. We can think of this as a special case of using the maximum entropy principle.

![independence](05-max_entropy/independence.png)

</Expand>

<Expand advanced={true} headline ="Beta Distribution">
Our coin-flipping riddle from the [intro](01-kl_intro) was a bit silly - we somehow assumed that our coin was either fair, or 75/25 biased, but nothing else was possible. In reality, any bias $p$ is plausible, so a Bayesian detective would work with a distribution over biases with domain $[0,1]$, and she would update the whole distribution after each flip. 

What distribution over $[0,1]$ should she choose? If she starts with the uniform distribution (max-entropy without any constraints), then the family of the distributions that she may see after a few flips is essentially the [Beta distributions](https://en.wikipedia.org/wiki/Beta_distribution). 

Here's another reason for why this family is natural: We could argue that given some $X \in [0,1]$ representing probability (unknwown coin bias), the more relevant quantity to work with is the logit - $\log X / (1-X)$. So, shouldn't the _right_ distribution to work with be the max-entropy distribution for $f(X) = \log X / (1-X)$? Unfortunately, max-entropy distribution for this does not exist (it blows up on one end of $[0,1]$), but the max-entropy family for $f_1(X) = \log X$ and $f_2(X) = \log (1-X)$ normalize in the relevant scenarios and it's the family of Beta distributions. 
</Expand>
<Expand advanced={true} headline ="Exponential Family">

In the case of discrete distributions over, say, $\{1, \dots, K\}$, literally any distribution is a maximum entropy distribution for certain $K$ constraints. For example, for your favorite distribution $p = (p_1, \dots, p_K)$, choose the $j$-th constraint to be $E[\mathbb{1}_j(i)] = p_j$ where $\mathbb{1}_j$ returns 1 for $i=j$ and 0 otherwise; the max entropy distribution for these $K$ constraints is exactly $p$.

However, for distributions over real numbers and finitely many reasonable functions $f_1, \dots, f_m$, only a small proportion of distributions are max-entropy for some family of functions.

The **exponential family** is the elite group of distributions that are maximum entropy distributions for some functions $f_1, \dots, f_m$. <Footnote> More precisely, it's the family of distributions that are "min KL distributions" for some $q$: A distribution from that family minimizes $D(p,q)$ from some not necessarily uniform distribution $q$, given some constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$. As an example, take the domain $\{0, 1, \dots, n\}$ and consider the constraint $f(X) = X$. We have already seen that this leads to the exponential distribution, given we start with uniform $q$. Now, consider $q$ with <Math math = "q_i = {n \choose i} / 2^n"/> instead. The new solution is the distribution $p$ with <Math math = "p_i \propto {n \choose i} \cdot e^{\lambda i}"/>. After we substitute $\lambda = \log p/(1-p)$, we get the formula for the binomial distribution. Thus, binomial distribution belongs to the exponential family using $f(X) = X$, even though it's not a max-entropy distribution for that $f$.</Footnote>
So, any distribution with a finite domain is in the exponential family. Any distribution we've discussed so far (exponential, geometric, normal, power-law, beta) is in the exponential family. [Wikipedia](https://en.wikipedia.org/wiki/Exponential_family) contains a long list of distributions in that family, many of which I've never heard of.

The importance of this family is that its distributions have a bunch of nice and intuitive properties.
<Expand advanced={true} headline="A theoretically nice property of exponential-family distributions">
Here's one of the nice properties that's relevant for the next chapter but perhaps too obscure to fully appreciate on a first read.

Suppose you have some data with mean $\mu$ and variance $\sigma^2$ and you want to fit it with a distribution. There are two ways to approach this:

1.  Use the maximum entropy principle to deduce the right _family_ of distributions: In this case, we would use it to restrict our attention to the class of Gaussian distributions. Then use maximum likelihood to find the best parameters <Math math = "\hat{\mu}, \hat{\sigma^2}" /> among Gaussians. It turns out that <Math math = "\hat\mu_{MLE} = \mu, \hat\sigma^2_{MLE} = \sigma^2"/>.

2.  Use the maximum entropy principle directly without any MLE. The max entropy distribution with mean $\mu$ and variance $\sigma^2$ is the Gaussian $N(\mu, \sigma^2)$.

Both approaches yield the same answer, but it's not clear a priori that this should be the case! Fortunately, distributions in the exponential family have the nice property that both approaches agree. Formally, if your exponential-family distribution is defined by constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$, then <Math math = "\hat\alpha_{1, MLE} = \alpha_1, \dots, \hat\alpha_{m,MLE} = \alpha_m" />.
</Expand>

</Expand>



## 🚀 What's next? <a id="next-steps"></a>

In the [next chapter](07-machine_learning), we'll see how the combo of maximum likelihood + maximum entropy explains the choice of loss functions used in machine learning.


=================================================================================
=================================================================================
CHAPTER: Loss functions
FILE: 06-machine_learning.mdx
=================================================================================
=================================================================================

[ERROR: File public/06-machine_learning.mdx not found]



=================================================================================
=================================================================================
CHAPTER: Machine Learning Problems (from MLProblemExplorer widget)
SOURCE: components/widgets/MLProblemExplorer.tsx
=================================================================================
=================================================================================


### Mean & Variance Estimation

**Probabilistic model:**
$$p(x_1,\\ldots,x_n\\mid \\mu,\\sigma^2) = \\prod_{i=1}^n \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x_i-\\mu)^2}{2\\sigma^2}}$$

**Loss function:**
$$\\hat{\\mu} = \\arg\\min_{\\mu} \\sum_{i = 1}^n (x_i-\\mu)^2$$

Given a set of numbers $X_1, \dots, X_n$, how do we estimate their mean and variance?

We've already approached this riddle from various angles. Now, let's combine our insights.

First, we transform the general idea that mean and variance are important into a concrete probabilistic model.
          The maximum entropy principle suggests modeling the data as independent samples drawn from 
          [the Gaussian distribution](04-max_entropy#normal).

Once we have a set of possible models—all Gaussian distributions—we can select the best one using 
          [the maximum likelihood principle](03-minimizing#mle).

We want to find $\hat\mu, \hat\sigma^2$ that maximize

$\hat\mu, \hat\sigma^2 = \argmin_{\mu, \sigma^2} \prod_{i = 1}^N \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(X_i-\mu)^2}{2\sigma^2}}$

It's typically easier to write down the logarithm of the likelihood function. As [we discussed](04-mle), we
          can call it cross-entropy minimization or log-likelihood maximization. In any case, the problem simplifies to
          this: 
        $\hat\mu, \hat\sigma^2 = \argmax_{\mu, \sigma^2} \sum_{i = 1}^n \log\left( \frac{1}{2\pi\sigma^2} e^{-\frac{(X_i-\mu)^2}{2\sigma^2}} \right) 
= \argmin_{\mu, \sigma^2} 2n \cdot \log \sigma + \sum_{i = 1}^n \frac{(X_i-\mu)^2}{2\sigma^2}$

There are several ways to solve this optimization problem. Differentiation is likely the cleanest: If we
          define $\\mathcal{L}$ to be the expression above, then:
        $\frac{\partial \mathcal{L}}{\partial \mu} = \frac{1}{\sigma^2} \sum_{i = 1}^n 2(X_i - \mu) $

Setting $\\frac{\\partial \\mathcal{L}}{\\partial \\mu} = 0$ leads to{' '}
          $\\hat\\mu = \\frac{1}{n} \\sum_{i=1}^n X_i$. Similarly,
        $\\frac{\\partial \\mathcal{L}}{\\partial \\sigma} = 2n/\\sigma -2  \\sum_{i = 1}^n \\frac{(X_i-\\mu)^2}{\\sigma^3}$

Setting $\\frac{\\partial \\mathcal{L}}{\\partial \\sigma} = 0$ then leads to{' '}
          $\\hat\\sigma^2 = \\frac{1}{n} \\sum_{i = 1}^n (X_i - \\mu)^2$.

$\hat\mu = \argmin_{\mu} \sum_{i = 1}^N (X_i-\mu)^2$

In this specific case, the optimization problem has a closed-form solution 
          $\hat\mu = \frac{1}{N} \cdot \sum_{i = 1}^N X_i$ (and the formula for 
          $\hat\sigma^2$ is analogous). Notice that while our formulas themselves don't explicitly
          mention probabilities, probabilities are essential for understanding the underlying mechanics.

What I want to emphasize is how our only initial assumption about the data was simply, "we have a bunch of
          numbers, and we care about their mean and variance." The rest flowed automatically from our understanding of
          KL divergence.

---

### Linear Regression

**Probabilistic model:**
$$p((x_1,y_1),\\ldots\\mid a,b,\\sigma^2) = \\prod_{i=1}^n \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(a x_i + b - y_i)^2}{2\\sigma^2}}$$

**Loss function:**
$$\\hat{a},\\hat{b} = \\arg\\min_{a,b} \\sum_{i=1}^n (a x_i + b - y_i)^2$$

Suppose we are given a list of pairs $(x_1, y_1), \dots, (x_n, y_n)$. We believe the data
          exhibits a roughly linear dependency, meaning there exist some constants $a,b$ such that 
          $y_i \approx a\cdot x_i + b$. Our objective is to determine $a$ and 
          $b$.

Let's transform this into a concrete probabilistic model. We'll model the data by assuming 
          $y_i$ originates from the distribution $a\cdot x_i + b + \text{noise}$.

The noise is generated from a real-valued distribution. How do we choose it? The uniform distribution doesn't
          normalize over real numbers, making it unsuitable; the same applies to the exponential distribution. The next
          logical choice is the **Gaussian distribution** $N(\mu, \sigma^2)$, so let's
          select that. This introduces a slight complication as we now have two new parameters, 
          $\mu, \sigma^2$, in our model 
          $y_i \sim a\cdot x_i + b + N(\mu, \sigma^2)$, even though we primarily care about 
          $a$ and $b$.

But this is fine. First, we can assume $\mu = 0$, because otherwise, we could replace 
          $N(\mu, \sigma^2)$ with $N(0, \sigma^2)$ and $b$ with 
          $b + \mu$ to achieve the same data model. We'll address $\sigma$ in a
          moment.

Let's proceed with our recipe and apply the maximum likelihood principle. We write down the likelihood of our
          data given our model:

$P((x_1, y_1), \dots, (x_n, y_n) | a, b, \sigma^2, x_1, \dots, x_n) = \prod_{i = 1}^n \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(ax_i + b - y_i)^2}{2\sigma^2}}$

As usual, it's simpler to consider the log-likelihood (or cross-entropy):

$\log P(\text{data} | \text{parameters}) = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2$

This expression appears rather complex, but we notice that for any fixed value of 
          $\sigma^2$, the optimization problem for $a,b$ reduces to minimizing:

$\hat{a}, \hat{b} = \argmin_{a,b} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2$

Therefore, we can effectively disregard the added parameter $\sigma^2$ and simply optimize
          above expression, which is the classical 
          [least-squares loss function](https://en.wikipedia.org/wiki/Ordinary_least_squares) for linear
          regression. Notice how the square in the loss function emerged directly from our maximum entropy assumption of
          Gaussian noise.

    ),
  },
  kMeans: {
    model: `p(x) = \\frac{1}{k} \\sum_{j=1}^k \\mathcal{N}(x\\mid \\mu_j,\\sigma^2 I)`,
    loss: `\\arg\\min_{\\mu_1,\\ldots,\\mu_k} \\sum_{i=1}^n \\min_j \\|x_i-\\mu_j\\|^2`,
    explanation: () => (
      <div>

We are given a set of points $x_1, \dots, x_n$ on, say, a 2D plane. Our objective is to
          group them into $k$ clusters.

Let's transform this into a probabilistic model. We'll use $\mu_1, \dots, \mu_k$ to
          represent the centers of these clusters. The significance of these points is that if a point 
          $x_i$ belongs to cluster $j$, then its Euclidean distance 
          $||x_i - \mu_j||$ should be small.

As before, we can employ the maximum entropy distribution to construct a concrete model. Since the exponential
          function doesn't normalize, we will use the Normal distribution:

$p(x | \mu_j) \propto e^{-\frac{||x-\mu_j||^2}{2\sigma^2}}$

The notation $p(x | \mu_j)$ signifies that this is our model for points originating from
          the $j$
          -th cluster. However, we desire a complete probabilistic model $p(x)$. We can achieve this
          by assigning a prior probability to how likely each cluster is. The maximum entropy prior is the uniform
          distribution, so we will choose:

$p(x) = \frac{1}{k} \sum_{j = 1}^k p(x | \mu_j)$

We now have a probabilistic model that generates data $x$ from a distribution 
          $p$. It's parameterized by $k+1$ values: 
          $\mu_1, \dots, \mu_k$, and $\sigma^2$. We will use maximum likelihood to
          determine these parameters. The principle dictates that we should maximize the following log-likelihood:

$\argmax_{\substack{\mu_1, \dots, \mu_k \\ \sigma^2}} -n \log \left( k\sqrt{2\pi\sigma^2}\right) + \sum_{i = 1}^n  \log \sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$

Optimizing this expression corresponds to an algorithm known as 
          [
            soft $k$
            -means
          ](https://en.wikipedia.org/wiki/Fuzzy_clustering)
          . The term "soft" indicates that the parameter $\sigma$ allows us to output a probability
          distribution for each point $x$, indicating its likelihood of belonging to each cluster.

In practice, people typically don't care that much about probabilistic assignment in $k$
          -means; knowing the closest cluster is usually sufficient. This corresponds to considering the limit as 
          $\sigma \rightarrow 0$. In this limit, the messy expression above simplifies quite
          elegantly. Specifically, we can replace the summation 
          $\sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ with 
          $\max_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ because all terms in the sum,
          except the largest one, become negligible as $\sigma \rightarrow 0$. The expression then
          simplifies to:

$\argmin_{\substack{\mu_1, \dots, \mu_k}} \sum_{i = 1}^n \min_{j = 1}^k ||x_i-\mu_j||^2$

The problem of finding $\mu_1, \dots, \mu_k$ that minimize this expression is called 
          [
            $k$
            -means
          ](https://en.wikipedia.org/wiki/K-means_clustering)
          .

---

### k-Means Clustering

**Probabilistic model:**
$$p(x) = \\frac{1}{k} \\sum_{j=1}^k \\mathcal{N}(x\\mid \\mu_j,\\sigma^2 I)$$

**Loss function:**
$$\\arg\\min_{\\mu_1,\\ldots,\\mu_k} \\sum_{i=1}^n \\min_j \\|x_i-\\mu_j\\|^2$$

We are given a set of points $x_1, \dots, x_n$ on, say, a 2D plane. Our objective is to
          group them into $k$ clusters.

Let's transform this into a probabilistic model. We'll use $\mu_1, \dots, \mu_k$ to
          represent the centers of these clusters. The significance of these points is that if a point 
          $x_i$ belongs to cluster $j$, then its Euclidean distance 
          $||x_i - \mu_j||$ should be small.

As before, we can employ the maximum entropy distribution to construct a concrete model. Since the exponential
          function doesn't normalize, we will use the Normal distribution:

$p(x | \mu_j) \propto e^{-\frac{||x-\mu_j||^2}{2\sigma^2}}$

The notation $p(x | \mu_j)$ signifies that this is our model for points originating from
          the $j$
          -th cluster. However, we desire a complete probabilistic model $p(x)$. We can achieve this
          by assigning a prior probability to how likely each cluster is. The maximum entropy prior is the uniform
          distribution, so we will choose:

$p(x) = \frac{1}{k} \sum_{j = 1}^k p(x | \mu_j)$

We now have a probabilistic model that generates data $x$ from a distribution 
          $p$. It's parameterized by $k+1$ values: 
          $\mu_1, \dots, \mu_k$, and $\sigma^2$. We will use maximum likelihood to
          determine these parameters. The principle dictates that we should maximize the following log-likelihood:

$\argmax_{\substack{\mu_1, \dots, \mu_k \\ \sigma^2}} -n \log \left( k\sqrt{2\pi\sigma^2}\right) + \sum_{i = 1}^n  \log \sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$

Optimizing this expression corresponds to an algorithm known as 
          [
            soft $k$
            -means
          ](https://en.wikipedia.org/wiki/Fuzzy_clustering)
          . The term "soft" indicates that the parameter $\sigma$ allows us to output a probability
          distribution for each point $x$, indicating its likelihood of belonging to each cluster.

In practice, people typically don't care that much about probabilistic assignment in $k$
          -means; knowing the closest cluster is usually sufficient. This corresponds to considering the limit as 
          $\sigma \rightarrow 0$. In this limit, the messy expression above simplifies quite
          elegantly. Specifically, we can replace the summation 
          $\sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ with 
          $\max_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}$ because all terms in the sum,
          except the largest one, become negligible as $\sigma \rightarrow 0$. The expression then
          simplifies to:

$\argmin_{\substack{\mu_1, \dots, \mu_k}} \sum_{i = 1}^n \min_{j = 1}^k ||x_i-\mu_j||^2$

The problem of finding $\mu_1, \dots, \mu_k$ that minimize this expression is called 
          [
            $k$
            -means
          ](https://en.wikipedia.org/wiki/K-means_clustering)
          .

    ),
  },
  logisticRegression: {
    model: `p(\\text{red}|(x,y)) = \\sigma(\\lambda(\\theta\\cdot(x,y)+\\delta))`,
    loss: `\\arg\\min_{\\theta,\\delta,\\lambda} \\sum_i \\ell_i \\log p_i + (1-\\ell_i) \\log(1-p_i)`,
    explanation: () => (
      <div>

This time, we're presented with red and blue points on a plane, and our goal is to find the optimal line that
          separates them. Ideally, all red points would be on one side and all blue points on the other, but this isn't
          always achievable. In such cases, how do we determine the "best" separating line?

It will be easier to represent the line not as $y = ax+b$, but using its normal vector 
          $\theta$ (orthogonal to the line) and the distance $\delta$ of the
          origin from the line.

Given a point $(x, y)$, the crucial quantity is its distance from our line. This can be
          calculated using the dot product as $\theta \cdot (x, y) + \delta$.

Now, employing the maximum entropy principle, we construct a probabilistic model that transforms this distance
          into a probability of color. We utilize the [logistic function](04-max_entropy). That is, our model
          states:

$p(\textrm{red} | (x, y)) = \sigma\left( \lambda (\theta \cdot (x, y) + \delta) \right)$

where $\sigma$ is the logistic function $\sigma(x) = e^x / (1+e^x)$.
          Naturally, we also have $p(\textrm{blue} | (x, y)) = 1 - p(\textrm{red} | (x, y))$.

The constant $\lambda$ is a new parameter that the max-entropy principle compels us to add
          to our probabilistic model. Fortunately, it's quite a useful parameter—it quantifies our confidence in the
          classification. This is convenient because if we want to classify a new point in the future, we can not only
          assign it a red/blue color based on which side of the line it falls, but also use the equation above to
          compute how certain we are about our classification.

Once we have a model, we can apply the maximum likelihood principle to find its parameters. This principle
          instructs us to find $a,b,\lambda$ that minimize the following log-likelihood:

$\argmin_{\theta, \delta, \lambda} \sum_{i = 1}^n \ell_i \log \sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)) + (1-\ell_i) \log (1-\sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)))$

where $\ell_i$ is an indicator variable (i.e., $\ell_i \in \{0,1\}$)
          denoting whether the point $(x_i,y_i)$ is red. This problem, known as 
          [logistic regression](https://en.wikipedia.org/wiki/Logistic_regression), is hard to solve exactly
          (NP-hard in particular), but gradient descent typically works well.

---

### Logistic Regression


---


################################################################################
PART III: COMPRESSION (BONUS CHAPTERS)
################################################################################

=================================================================================
=================================================================================
CHAPTER: Coding theory
FILE: 09-coding_theory.mdx
=================================================================================
=================================================================================

[ERROR: File public/09-coding_theory.mdx not found]



=================================================================================
=================================================================================
CHAPTER: Kolmogorov complexity
FILE: 08-kolmogorov.mdx
=================================================================================
=================================================================================

[ERROR: File public/08-kolmogorov.mdx not found]


################################################################################
ADDITIONAL BONUS CHAPTERS
################################################################################

=================================================================================
=================================================================================
CHAPTER: Multiplicative Weights Update
FILE: 07-algorithms.mdx
=================================================================================
=================================================================================

[ERROR: File public/07-algorithms.mdx not found]



=================================================================================
=================================================================================
CHAPTER: Fisher Information
FILE: fisher-info.mdx
=================================================================================
=================================================================================

# Fisher information & statistics

In this chapter, we will explain a bit more about how KL divergence connects to statistics. In particular, one of the key statistical concepts is a so-called Fisher information, and we will see how one can derive it using KL divergence.

<KeyTakeaway>
Fisher information is the limit of KL divergence of close distributions.  
</KeyTakeaway>

## 📊 The polling problem

In [one of our riddles](00-riddles), we have been talking about the problem with polling: If you want to learn the percentage of the vote for one party up to $\eps$, you need sample about $1/\eps^2$ voters. 

<PollingErrorCalculator />

### 📊 The law of large numbers

One way to understand why we need $\Omega(1/\eps^2)$ samples is via [the law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers). This law tells you that if you flip a fair coin $n$ times, you typically get around $n/2 \pm O(\sqrt{n})$ heads. <Footnote>You can prove this by estimating the variance of the sum and using [Chebyshev's inequality](https://en.wikipedia.org/wiki/Chebyshev%27s_inequality). </Footnote>. If your coin is biased and heads come out with probability $1/2 + \eps$, then the law says you will typically see around $(1+\eps)n/2 \pm O(\sqrt{n})$ heads. If you want to be able to separate the two options, you need the two intervals $n/2 \pm O(\sqrt{n})$ and $(1+\eps)n/2 \pm O(\sqrt{n})$ to be disjoint, which means that you have to choose $\eps$ such that $\eps \cdot n \approx \sqrt{n}$, i.e., $n$ should be at least around $1/\eps^2$.

### 💡 KL intuition

But I want to offer a complementary intuition for the polling problem. Let's go all the way back to [the first chapter where we introduced KL](01-definition). Our running example was a Bayesian experimenter who wanted to distinguish whether his coin is fair or not fair. If the two distributions to distinguish are $(50\%, 50\%)$ and $(50\% + \eps, 50\% - \eps)$, then the problem of our experimenter gets extremely similar to the problem of estimating the mean up to $\eps$!

Remember, if we have two very similar distributions, KL between them is going to be positive, but very small. It turns out that

$$
D((0.5 + \eps, 0.5 - \eps), (0.5, 0.5)) \approx 2\eps^2
$$

The intuition we should take from this is that each time we flip a coin, we get around "$2\eps^2$ bits of information" about whether the coin is fair or biased by $\eps$. Intuitively, once we get around 1 bit of information, we begin to be able to say which of the two coins we are looking at. We conclude that the number of trials we need to estimate the bias of a coin should scale like $n = 1/\eps^2$. 

## 🎯 Fisher information

The trick with looking at KL divergence between two very similar distributions can be generalized further. Think of a setup where you have a family of distributions characterized by some number. For example:

- biased coins with heads-probability $p$ for all $p \in [0,1]$.
- gaussians $N(\mu, 1)$ for all $\mu \in \mathbb{R}$.
- gaussians $N(0, \sigma^2)$ for all $\sigma^2 \ge 0$.

More generally, think of a set of distributions $p_\theta$ parameterized by a number $\theta$.

One of the most basic tasks in statistics is that we have an empirical distribution $p$ and we want to find the $\theta$ so that $p_\theta$ fits the data the best, like below. 


![fit](03-minimizing/fit.png)


We have already seen this a few times, and we have seen in [the chapter about minimizing KL](03-minimizing) why the maximum likelihood estimators are a reasonable approach to this.

But we can go a bit further -- if we assume that $p$ has literally been generated by one of the distributions $p_\theta$ for some $\theta$, we may ask how many samples we need to estimate $\theta$ up to additive $\eps$. Our polling question is just a special case of this more general question.

Our intuition about KL tells us if the data were generated by $p_\theta$, to estimate $\theta$ it's key to understand the value of <Math math="D(p_{\theta + \eps}, p_\theta)" />. This is the general (and a bit opaque) formula we thus need to understand:

<Math displayMode={true} math="
D(p_{\theta + \eps}, p_\theta) = \int p_{\theta + \eps}(x) \cdot \log \frac{p_{\theta + \eps}}{p_\theta} dx
" />

We will estimate the value of the right-hand side by computing the derivatives <Math math="\frac{\partial}{\partial \theta} p_{\theta}"/> and <Math math = "\frac{\partial^2}{\partial \theta^2} p_{\theta}" />. In particular, we will estimate <Math math = "p_{\theta + \eps}" /> with the following Taylor-polynomial approximation. 

<Math displayMode={true} math="
p_{\theta + \eps}(x)
\approx
p_{\theta}(x)
+ \eps\cdot \frac{\partial}{\partial \theta} p_{\theta}(x)
+ \frac12 \frac{\partial^2}{\partial \theta^2} p_{\theta}(x)
+ O(\eps^3)
" />

After plugging it in and some calculations <Footnote>[todo fill]</Footnote>, we get

<Math displayMode={true} math="
D(p_{\theta + \eps}, p_\theta) \approx \frac12 I(\theta) \cdot \eps^2 + O(\eps^3)
" />
for 
<Math displayMode={true} math = "I(\theta) = \int p_\theta(x) \cdot (\frac{\partial}{\partial \theta} \log p_\theta(x))^2 dx" />
The term $I(\theta)$ is called _Fisher information_. Let's not try to understand what this integral mean. The short story is that you can approximate KL divergence of two similar distributions as $I(\theta)\cdot \eps^2$ and $I(\theta)$ can often be computed by integration.

Our KL intuition is telling us that estimating a parameter $\theta$ up to $\eps$ should require about <Math math="\Theta\left(\frac{1}{I(\theta)\eps^2}\right)" /> many samples. Let's see what this intuition is saying in some cases:

1. If you want to estimate $p$ of a biased coin, $I(p) = \frac{1}{p(1-p)}$. Thus, our KL intuition suggests that estimating the value of $p$ (with constant probability) should take about $p(1-p)/\eps^2$ samples. This is indeed the right formula (see the widget above). 

2. If you want to find the mean of normal random variable with known variance $\sigma^2$, we have $I(\mu) = 1/\sigma^2$. Hence, our KL intuition suggests that estimating $\mu$ up to $\eps$ requires about $\sigma^2 / \eps^2$ samples.

3. If you want to find the variance of normal random variable with known mean $\mu$, we have $I(\sigma^2) = 1/(2\sigma^4)$. Hence, our KL intuition suggests that estimating $\sigma^2$ requires about $\sigma^4 / \eps^2$ samples.

In all above cases, it turns out to be the case that our intuition is correct and really describes how many samples you need to solve given problem. In fact, there are two important results in statistics: One of them is [Cramér-Rao lower bound](https://en.wikipedia.org/wiki/Cram%C3%A9r%E2%80%93Rao_bound) that basically says that our formula of $n = 1/(I(\theta)\eps^2)$ is indeed a lower bound. On the other hand, the so-called [asymptotic normality theorem for MLE](https://gregorygundersen.com/blog/2019/11/28/asymptotic-normality-mle/) says that the MLE estimator is as good as our formula. <Footnote> These theorems use somewhat different language and measure the goodness of an estimator using its variance. </Footnote>

The upshot is that computing KL between two close distributions basically answers the most fundamental question of (frequentist) statistics -- how many samples do I need to get a good estimate of a parameter. 

## 📏 Fisher metric

Although KL divergence is asymetrical, it gets symmetrical in the limit. That is, if we do the computation for <Math math="D(p_\theta, p_{\theta + \eps})" /> instead of <Math math="D(p_{\theta + \eps}, p_\theta)" />, we would get the same expression up to some $O(\eps^3)$ terms. So, in this setup where we try to understand two distributions that are very close together, we can really think of it as being symetric. This way, we can define a proper distance function on the space of distributions -- it's called [Fisher information metric](https://en.wikipedia.org/wiki/Fisher_information_metric) and can give useful intuitions. For example, for the case of biased-coin-flipping distributions where coins have bias $p \in [0,1]$, we can represent all of them using a segment like this:

![Fisher metric](07-fisher_info/fisher2.png)

The Fisher information metric says that locally, the KL distance around a point $p$ is proportional to $I(p) = 1/(p(1-p))$. That is, the probabilities around $1/2$ are "closer together" than the probabilities at the edges. 
This is a supercharged-abstract-fancy way of saying what we have already seen many times -- probabilities should often be handled multiplicatively, not additively.



################################################################################
META PAGES
################################################################################

=================================================================================
=================================================================================
CHAPTER: Resources
FILE: resources.mdx
=================================================================================
=================================================================================

# Resources <a id="resources"></a>

Here are some great resources for further exploring related topics. 📚 stands for a book, 📝 for a blog posts. I tried to sort them to one of the three parts of this mini-course, but books are often relevant for several parts. 


## Part I: Bayes' rule, KL divergence, (cross-)entropy
- 📝 [Six and half intuitions for KL divergence](https://www.lesswrong.com/posts/no5jDTut5Byjqb4j5/six-and-a-half-intuitions-for-kl-divergence) by CallumMcDougall. 
- 📚 [Probability Theory: The Logic of Science](https://bayes.wustl.edu/etj/prob/book.pdf) by E. Jaynes <Footnote>Jaynes is the father of maximum entropy principle and other profound ideas. His book is at times philosophical, and usually very enlightening. Also, it is unfinished and contains errors.</Footnote>
- 📚 [Entropic Physics](https://drive.google.com/file/d/1faiZCbg_HnmKayI7hBFWfhNSuZZU451Y/view) by Ariel Caticha 
- 📚 [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/itprnn/book.html) by David MacKay
- 📚 [Intuition behind KL Divergence](https://johfischer.com/2021/12/31/intuitive-explanation-of-the-kullback-leibler-divergence/) by Johannes Schusterbauer. 


## Part II: Optimization
- 📝 [Bayes' rule](https://www.lesswrong.com/w/bayes-rule) by alexei and E. Yudkowsky
- 📝 [Why KL?](https://blog.alexalemi.com/kl.html), [KL is all you need](https://blog.alexalemi.com/kl-is-all-you-need.html) blog [posts](https://blog.alexalemi.com/diffusion.html) by Alex Alemi.  
- 📝 [Maximum Entropy and Bayes' rule](https://risingentropy.com/maximum-entropy-and-bayes/) by Rising Entropy blog
- 📚 [Machine Learning: A Probabilistic Perspective](https://probml.github.io/pml-book/book0.html) by Kevin P. Murphy
- 📝 [The principle of maximum entropy](https://caseychu.io/posts/maximum-entropy-kl-divergence-and-bayesian-inference/#:~:text=,one%20with%20the%20maximum%20entropy)

## Part III: Compression 
- 📚 [Elements of Information Theory](https://www.wiley.com/en-us/Elements+of+Information+Theory%2C+2nd+Edition-p-9780471241959) by Thomas Cover & Joy Thomas
- 📚 [Why Philosophers Should Care About Computational Complexity](https://arxiv.org/abs/1108.1791)



=================================================================================
=================================================================================
CHAPTER: About
FILE: about.mdx
=================================================================================
=================================================================================

# 📚 About This Mini-Course <a id="what-this-course-covers"></a>

This mini-course starts with [a few puzzles and challenges](00-riddles), all of them at the intersection of probability, information theory, and machine learning. They motivate the next five chapters that build up the relevant theory to solve them. 

Here are some keywords we will explore: KL divergence, entropy, cross-entropy, max likelihood & max entropy principles, loss functions, coding theory, compression, Kolmogorov complexity and more. 

## 📖 How to read this

Skip stuff you find boring, especially expanding boxes & footnotes. Skip boxes labeled with ⚠️ even more. Follow links, get nerdsniped, and don't feel the need to read this linearly. 

This mini-course does not contain many formal theorem statements or proofs since the aim is to convey intuition in an accessible way. The downside is that some discussions are necessarily a bit imprecise. To get to the bottom of the topic, copy-paste the chapter to your favorite LLM and ask for details. 

The total length of the main text is about 2 chapters of Harry Potter and the Philosopher's Stone (from the beginning to Harry's first experience with magic). About 5 chapters if you read all footnotes, expand boxes, and bonus content (Harry learns he's a wizard). In either case, I can't promise you will feel the same as Harry.  


{/*
If you want to gain experience and level up your probability stats, you can't take Harry-Potter-reading approach, though. 
See [resources](resources) for some links. 
*/}

## 🧠 What is assumed <a id="what-we-assume"></a>

I assume probability knowledge after taking a typical introductory course at university.  
You should be familiar with the basic language of probability theory: probabilities, distributions, random variables, independence, expectations, variance, and standard deviation. 

[Bayes' rule](https://www.lesswrong.com/w/bayes-rule) is going to be especially important.<Footnote>I love reading [Yudkowsky's](https://www.lesswrong.com/w/bayes-rule) [explanations](https://www.lesswrong.com/w/test-2) of The Rule. </Footnote>
I also assume that you get the gist of [the law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers) <Footnote>If you keep flipping a fair coin $n$ times, you get around $n/2$ heads. Or, more generally & technically, if you keep flipping a biased coin with bias $p$ and $X_i \in \{0,1\}$ is whether the $i$-th outcome is Heads, the sample bias $\hat{p} = 1/n \cdot \sum_{i = 1}^n X_i$ is likely to be very close to the true bias $p$. </Footnote> and maybe even the [central limit theorem](https://en.wikipedia.org/wiki/Central_limit_theorem). <Footnote>If you keep flipping a coin, the number of heads you'll see follows a distribution that looks a bit like a [devoured elephant](https://www.amazon.com/KIUB-Postcard-Little-elephant-10x15cm/dp/B0CKSVVWDL). More generally & technically, if $X_1, \dots, X_n$ follow the same (reasonable) distribution, and $n$ is large enough, the distribution of the sample mean looks like the [Gaussian distribution](https://en.wikipedia.org/wiki/Normal_distribution), with standard deviation of the order of $1/\sqrt{n}$. </Footnote>

Knowing example uses of machine learning, statistics, or information theory helps a good bit to appreciate the context.


## 🎯 About This Project

This text was written by <a href="https://vaclavrozhon.github.io/">Vašek Rozhoň</a> and arose from a joint project with <a href="https://gavento.cz/">Tom Gavenčiak</a>. 

We were thinking about __open exposition problems__<Footnote>The phrase comes from one of my [favorite exposition papers](https://timothychow.net/forcing.pdf). </Footnote> - Inasmuch as there are open _scientific_ problems where we haven't figure out how the Nature works, there are also open _exposition_ problems where we haven't figure out the best way to convey our knowledge. We had a joint probability seminar at Charles University where we tried to work out how to teach some important, underrated topics. This text tracks some of what we did in that seminar. 

The text is motivated by two open problems:

- How to adapt our teaching of computer science theory to convey more about neural networks? 
- How can we use the current capabilities of LLM to teach better, in general? 

The first problem motivates the content, the second one the form. 

{/*
First, I try to collect various ideas at the intersection of probability, statistics, and information theory that we are typically not teaching in standard undergrad courses, and repackage them. The result hopefully gives some useful intuitions behind current ML in particular, and behind using probability to understand the world around us in general. 

Second, with current LLM capabilities, some ways of presenting math suddenly got doable. The current text is full of widgets that will hopefully help you learn by playing with them. Let's see how it works! 
*/}

## 🤖👥 Thanks

I thank to my coauthors Claude, Gemini, and GPT. All three helped massively to create this mini-course. 

Thanks to Petr Chmel, Vojta Rozhoň, Robert Šámal, Pepa Tkadlec, and others for feedback. 


## ✉️ Feedback

I'd love to hear your feedback! Paste it [here](https://forms.gle/YourFormID) [todo], write a comment, or reach out to me directly. 



=================================================================================
=================================================================================
CHAPTER: Bonus
FILE: bonus.mdx
=================================================================================
=================================================================================

# Graveyard

I wrote some additional text that did not fit with the main story in the end that much, or that would make it too fractal to follow. I can't really find the courage to delete it, hence this bonus content. 
If eight chapters about KL divergence and entropy don't add enough excitement to your life, check it out!

## Bonus chapters

I wrote two chapters that show some nice stuff connected to KL divergence. 

### ⚖️ [Multiplicative Weights Update](/07-algorithms)

We explore the Multiplicative Weights Update (MWU) algorithm and its connections to entropy. This is a powerful algorithmic framework that appears in many areas of machine learning, game theory, and optimization.

Here's a motivating riddle: 

<Expand advanced={false} headline="💰 How to get rich"> <a id="get-rich"></a>

Here's a riddle that's behind a ton of recent algorithms in CS and ML. Say you wanna get rich trading stocks. Lucky you—$n$ investors share their tips every day. Each day $t$, they give advice, and afterward you find out how they did. For investor $i$, you get $g_i^{(t)}$ - how many dollars she gained that day.

Your strategy: Start with equal trust in everyone—$p_i^{(0)} = 1/n$ for all investors. Each morning, randomly pick an investor based on your trust distribution and follow their advice. After seeing how everyone did, update your distribution to $p^{(t+1)}$.

How should you update? What's best? <Footnote>The symbol $\propto$ means that the probability is only _proportional_ to this, you have to normalize the numbers so that they sum to one. </Footnote>

<MultipleChoiceQuestion
  options={[
    <>Follow the leader: Go with the expert that has the largest gain so far</>,
    <>Proportional sampling: <Math math="p_i^{(t+1)} \propto \ell_i^{(1)} + \dots + \ell_i^{(t)}" /></>,
    <>Multiplicative sampling: <Math math="p_i^{(t+1)} \propto e^{\eps \cdot \left( \ell_i^{(1)} + \dots + \ell_i^{(t)} \right) }" /> for some small <Math math="\eps" /></>
    ]}
  correctIndices={[0, 2]}
  explanation={<>The last option is the most robust, though follow-the-leader typically also works well. It's called multiplicative weights update, and it looks weirdly like gradient descent. [We'll see](07-algorithms) how KL divergence explains the connection.<br/><br/>Try it yourself with the widget below:<br/><br/><MWUWidget /></>}
/>
</Expand>


### 🎣 [Fisher Information](/fisher-info)

We dive into Fisher information and its fundamental role in statistics and information geometry. We derive it as a limit of KL divergence for close distributions. 

Here's a motivating riddle: 

<Expand advanced={false} headline="🗳️ Why polling sucks"><a id="polling"></a>

A typical [US election poll](https://en.wikipedia.org/wiki/Nationwide_opinion_polling_for_the_2024_United_States_presidential_election) asks 1000-2000 random people. Do the math and you'll find such polls are usually within 2-3% of the truth.<Footnote>This assumes you can actually sample random voters, they tell the truth, etc. This is never true but stick with me.</Footnote> Pretty wild—it doesn't even matter how many people live in the country, 1000 random ones get you within a few percent!

But here's the thing: US elections are super close. We already know both parties will get around 50%. So maybe we should poll more people (or combine polls) to get within 0.1%. How many people would that take?

<MultipleChoiceQuestion
  options={["about 10,000", "about 100,000", "about 1,000,000"]}
  correctIndices={[2]}
  explanation={<>It's about 1,000,000! That's a huge chunk of the whole US! The general rule: to get error margin <Math math="\eps" />, you need roughly <Math math="1/\eps^2" /> samples. That square is killer—it's why getting better estimates gets expensive fast! No wonder most polls stick to a few thousand people.<br/><br/>But why <Math math="1/\eps^2" />? Explore the relationship below:<br/><br/><PollingErrorCalculator /></>}
/>
</Expand>


## Bonus random content 

More on entropy and KL divergence applications; cut from [the third chapter](03_entropy-properties). 

<Expand headline="Chain rule & uniqueness" advanced={true}>
There's also a slightly fancier version of additivity called the _chain rule_. 


Say I've got distributions $p,q$ for how I get to work (\{🚶‍♀️, 🚲, 🚌\}). But when I take the bus, I also track which line (\{①, ②, ③\}), with conditional distributions $p', q'$. Combining $p$ and $p'$ gives me an overall distribution <Math math = "p_{\textrm{overall}}" /> over \{🚶‍♀️, 🚲, ①, ②, ③\}. 

For example, if $p=$\{🚶‍♀️: 0.3, 🚲: 0.3, 🚌: 0.4\} and $p'=$\{①: 0.5, ②: 0.25, ③: 0.25\}, then <Math math = "p_{\textrm{overall}}=" />\{🚶‍♀️: 0.3, 🚲: 0.3, ①: 0.2, ②: 0.1, ③: 0.1\}. 

The chain rule says:

<Math displayMode={true} math="
D(p_{\textrm{overall}}, q_{\textrm{overall}}) = D(p,q) + p_{\textrm{bus}} \cdot D(p',q')
"/>
where <Math math = "p_{\text{bus}}" /> is how often I take the bus according to $p$. 

This is pretty intuitive! First off, as we refine our distributions, the divergence gets larger. In other words, telling $p_{overall}$ apart from $q_{overall}$ is easier than just telling $p$ from $q$. 

But the formula even tells us very precisely how much: the bus refinement helps by $D(p', q')$ whenever bus comes up. This happens with probability <Math math = "p_{\textrm{bus}}" />. 

Try proving this yourself or see how it gives us additivity! 

Here's something cool: any reasonable function with monotonicity and chain rule properties [has to be KL divergence](https://blog.alexalemi.com/kl.html).

That's pretty awesome—it means KL divergence isn't some arbitrary formula someone cooked up. There's literally only one measure with these natural properties, and it's KL divergence.


</Expand>


<Expand headline = "Conditional entropy and mutual information" advanced={true}>

I want to tell you about mutual information - a pretty important quantity that ties together our intuitions behind KL divergence and entropy. We won't need it in the future, so feel free to skip this one. 

First, a quick refresher: Let's say you've got two distributions $p_1$ and $p_2$. Maybe $p_1$ is about weather (☀️ or ☁️) and $p_2$ is how I get to work (🚶‍♀️, 🚲, or 🚌). A joint distribution is a table showing the probability of each combo. Here are three possible joint distributions for three different people:

![Which table is the "most" independent?](00-riddles/independence.png)

All three have the same _marginals_: 70% good weather, and 20%/30%/50% for walk/bike/bus.

Two distributions are independent if their joint distribution equals the product of the marginals. Here's what independence looks like:

![Independent distributions](00-riddles/independence2.png)

Here comes the riddle: Which of our three tables is "closest" to being independent? Try to think about it before going on. 


.


SPOILER ALERT:

.


To answer this question properly, we need a precise measure for how different each table is from the ideal independent one. There are more ways to do this<Footnote>For example, people often use [correlation](https://en.wikipedia.org/wiki/Correlation), but that has problems. First, correlation only works for numbers, not general stuff like \{☀️, ☁️\}. Also, zero correlation doesn't mean independence. </Footnote>, but using KL divergence is a very principled way to do this. We've got two distributions: the "truth" (one of our tables) and the "model" (the ideal independent table). The KL between them tells us how well the model matches reality—basically, how long until a Bayesian detective figures out the data isn't coming from the independent model.

The KL divergences for our tables:

$$
D(p_1, q) \approx 0.40
$$
$$
D(p_2, q) \approx 0.04
$$
$$
D(p_3, q) \approx 0.21
$$

So table 2 is "closest" to independence, as formalized by KL divergence. 

This works for any joint distribution $(r, s)$. The KL divergence between $(r, s)$ and the independent version $r \otimes s$ is called [mutual information](http://en.wikipedia.org/wiki/Mutual_information) between $r$ and $s$—it's a super-important quantity in information theory.

You can try to play with it in the widget below. 

<MutualInformationWidget /> 

There is a second intuition for mutual information. Intuitively, it tells us how many bits we learn about $X$ when we find out the value of $Y$ (or vice versa—it's symmetric). This can be formalized using entropy. 

First, recall the entropy formula $H(X) = \sum_{x} P(X = x) \log \frac{1}{P(X = x)}$. This formula still works if we condition on knowing that $Y$ takes a certain value $y$. We can write
<Math displayMode={true} math="H(X | Y = y) = \sum_{x} P(X = x | Y = y) \log \frac{1}{P(X = x | Y = y)}" />
The conditional entropy $H(X|Y)$ is defined as the entropy of $X$ after I sample $Y$ and learn its value, i.e.:
<Math displayMode={true} math="H(X|Y) = \sum_{y} P(Y = y) H(X | Y =y)" />

Now here's a cool fact: If you write down the definition of mutual information, you get:


<Math displayMode={true} math="I(X;Y) = H(X) - H(X|Y)" />

So in particular, $H(X|Y) \le H(X)$. That is, learning the value of $Y$ can only decrease the uncertainty on average about $X$ (and the difference is exactly the mutual information).

It is a good exercise to write down all the definitions to check that this is true. To get some intuition about this, guess what happens if we make $P$(☀️ AND 🚶‍♀️$) = P$(☁️ AND 🚲$) = \frac{1}{2}$ in the above widget. The mutual information is then 1 bit. That's because learning the value of one distribution, say transport, makes the entropy of weather smaller by 1 bit - the weather distribution changes from a coin flip ($H(\textrm{weather}) = 1$) to either determined ☀️ or determined ☁️ ($H(\textrm{weather} | \textrm{transport}) = 0$). 

</Expand>


